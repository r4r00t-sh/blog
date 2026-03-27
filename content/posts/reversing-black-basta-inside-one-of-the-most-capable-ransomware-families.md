---
title: "Reversing Black Basta: Inside One of the Most Capable Ransomware Families"
date: "2026-03-22"
author: "r4r00t"
topic: "Malware Analysis"
difficulty: "Advanced"
summary: "A technical deep-dive into Black Basta's binary — encryption scheme, anti-analysis tricks, safe mode abuse, and the crypto flaw that got it cracked."
---

Black Basta is one of the most well-documented ransomware families of the last few years, and also one of the most interesting to reverse. It shipped in multiple builds with different capability levels, evolved its encryption scheme across versions, and had a cryptographic implementation bug that let researchers decrypt files without paying — until the operators quietly fixed it.

This post tears into the binary: how it works, what it does to evade analysis, and how its encryption scheme was broken.

---

## Background and Attribution

Black Basta is a ransomware group operating as ransomware-as-a-service (RaaS), first spotted in April 2022. It is known to use double extortion techniques where the group demands payment for the decryption and non-release of stolen data. Earlier versions of Black Basta share many similarities with Conti ransomware.

The Conti connection is meaningful from a reversing standpoint. Black Basta used to operate under the name Conti, which was linked to some previous Emotet campaigns. Conti was then hacked in February 2022, and Black Basta emerged in April of 2022 by compromising a dozen companies internationally. The code reuse and operational similarities suggest a direct lineage — experienced developers rebuilding with a cleaner codebase after the Conti leak.

The Black Basta group ranks as one of the top 10 most prolific and destructive ransomware-as-a-service gangs of all time. In December 2023, a cryptocurrency analysis firm and an insurance company estimated the group had collected at least US $107 million in ransoms.

---

## The Binary: First Look

Black Basta is written in C++ and is cross-platform ransomware that impacts both Windows and Linux systems. In June 2022, a VMware ESXi variant of Black Basta was observed targeting virtual machines running on enterprise Linux servers.

### Three Builds, One Family

One of the more interesting aspects of early Black Basta samples is that researchers observed multiple distinct build configurations shipped within weeks of each other:

Interestingly, for Black Basta, three different builds of the ransomware were observed in a timeframe of approximately three weeks. One build contains extended evasion functionality. Another build attempts to include many methods into a single command-line argument (`-bomb`). Finally, a minimal build possesses only the core encryption functionality.

**The minimal build** is exactly what it sounds like — no packer, no evasion, just the encryption loop:

```
vssadmin.exe delete shadows /all /quiet
[encrypt files with ChaCha20 + RSA]
[write readme.txt to each directory]
[drop wallpaper jpg + .basta .ico]
```

Reversing this build first is useful because the lack of obfuscation lets you understand the core logic cleanly before tackling the more hardened versions.

**The evasion build** is more interesting. What sets this build apart is its inclusion of a novel detection evasion method and its requirement to run as an administrator. This build comes packed with code that allows it to act as a standard executable and a service, essentially functioning as a service installer.

**The automation build** adds the `-bomb` argument for network-wide propagation, though this was largely unused in observed incidents.

### Mutex Check

The ransomware spawns a mutex with the string `dsajdhas.0` to ensure a single instance of the malware is running at a time.

In Ghidra or x64dbg, look for `CreateMutexA`/`CreateMutexW` near the start of execution. If the mutex already exists, the binary exits cleanly — a useful anti-analysis signal because automated sandboxes running multiple instances of the same sample will only see one execution.

```c
// Decompiled mutex check (approximate)
HANDLE hMutex = CreateMutexW(NULL, TRUE, L"dsajdhas.0");
if (GetLastError() == ERROR_ALREADY_EXISTS) {
    CloseHandle(hMutex);
    return 0;  // bail out silently
}
```

---

## Anti-Analysis and Evasion

### Safe Mode Reboot Trick

The most operationally significant evasion in Black Basta isn't a code-level anti-debug — it's a systemic one. The evasion build reboots the machine into safe mode before encrypting.

After stopping a service and taking its name, the ransomware deletes it to create a new service with the same name in its place. Only this time, the executable linked to the service is the ransomware binary itself. After registering the ransomware binary with the service manager, it prepares the system for a reboot in safe boot mode.

The service hijacking target is the `Fax` service — a default Windows service that's typically unused but available. The ransomware:

1. Opens the `Fax` service via `OpenServiceW`
2. Deletes it with `DeleteService`
3. Creates a new service with the same name pointing at its own binary
4. Registers it to autostart in safe mode via registry:

```
HKLM\SYSTEM\CurrentControlSet\Control\SafeBoot\Network\Fax
```

5. Triggers reboot via:

```cmd
C:\Windows\SysNative\bcdedit.exe /set safeboot network
shutdown -r -f -t 0
```

Once the system is rebooted in safe mode, Black Basta uses the ChaCha20 algorithm to encrypt files. Safe mode loads a minimal driver set, which means most EDR products, AV agents, and security tooling simply don't start. The ransomware runs in a nearly unmonitored environment.

When analyzing this in a VM, be aware: if you let this build run, your analysis VM will reboot into safe mode. Take a snapshot before execution.

### Anti-Debug Techniques

There are quite a few anti-debug tricks implemented in the Black Basta dropper. One technique involves making a random number of calls to the `kernel32.Beep` function — not really an anti-debugger, but it makes log analysis harder by polluting the API call trace.

Two of the anti-debug checks in early samples were actually **broken**:

`FindWindow` with class name `▬unAwtFrame` — the first symbol is wrong; it should be `SunAwtFrame`. `NtQueryInformationProcess` checking `DebugPort` doesn't work because of a wrong DLL name.

This kind of sloppiness is informative: it suggests the anti-analysis code was either copied from another project or written quickly without testing. The functional techniques were:

- **`IsDebuggerPresent`** — standard PEB flag check
- **`CheckRemoteDebuggerPresent`** — via `NtQueryInformationProcess`
- **Timing checks** — measuring execution time between operations; sandboxes often accelerate time, making these checks detectable
- **Sandbox artifact detection** — checking for sandbox-specific process names, registry keys, and hardware fingerprints

In x64dbg, you can patch the conditional jumps after these checks (flip `JZ` to `JNZ` or NOP the jump entirely) to bypass them. In Ghidra, identify them by looking for code that calls these APIs and immediately checks the return value before a suspicious conditional exit.

### Stack-Based String Obfuscation (v2.0)

In November 2022, Black Basta received significant updates including the introduction of stack-based string obfuscation. Similar to Conti ransomware, the Black Basta developer appears to be experimenting with stack-based string obfuscation using ADVObfuscator. Strings are constructed on the stack and decoded using an XOR operation with a single byte.

In the disassembler, stack-obfuscated strings look like long sequences of `mov byte ptr [rbp-X], 0xYY` instructions building a buffer character by character, followed by a small XOR loop to decode them. FLOSS (FireEye Labs Obfuscated String Solver) can extract many of these automatically. For the rest, set a breakpoint just after the decode loop and read the buffer from the stack.

### Payload Concealment in the Dropper

The Black Basta payload is not simply unpacked and executed in memory — there is data located before the PE header of the ransomware to prevent automatic scanners from easily identifying the malicious payload.

This pre-header garbage data breaks the `MZ` signature detection that many scanners use. To find the actual PE, scan the dumped memory for the `MZ` magic bytes (`0x4D 0x5A`) rather than assuming the buffer starts at the image base.

---

## Encryption Scheme: v1 (ChaCha20 + RSA-4096)

This is the core of what makes Black Basta interesting to analyze.

### Key Generation

Black Basta ransomware generates 32 random bytes representing the ChaCha20 key and then 8 bytes representing the nonce using `rand_s`.

`rand_s` is a Windows CRT function that uses `RtlGenRandom` (aka `SystemFunction036`) under the hood — a cryptographically secure RNG. This key is unique **per file**.

```c
// Approximate decompiled key generation
BYTE chacha_key[32];
BYTE chacha_nonce[8];

for (int i = 0; i < 32; i++) rand_s(&chacha_key[i]);
for (int i = 0; i < 8;  i++) rand_s(&chacha_nonce[i]);
```

### Hybrid Encryption Model

ChaCha20 stream cipher is used for encryption with a key generated randomly for each encrypted file. This key is then passed to RSA encryption with a hardcoded public key to retrieve 512 bytes of the encrypted ChaCha20 key. This key is appended to the end of the encrypted file.

The structure of an encrypted file looks like:

```
[encrypted file content]
[512 bytes: RSA-encrypted ChaCha20 key + nonce]
[4 bytes: length of encrypted key block (0x200)]
```

The RSA-4096 public key is hardcoded in the binary. In Ghidra, it shows up as a large constant byte array — look for a 512-byte blob referenced during the encryption setup. The binary implements the RSA algorithm using the Mini-GMP library, which is fully available on GitHub. Identifying the GMP function signatures in the disassembly confirms you're looking at the right code path.

### Partial Encryption for Speed

To speed up the encryption process, the ransomware encrypts in chunks of 64 bytes, with 128 bytes of data remaining unencrypted between the encrypted regions.

File size determines the encryption stride:

```
Small files (< threshold):   fully encrypted
Medium files:                64 bytes encrypted, 128 bytes skipped, repeat
Large files (> 1GB):         first 5,064 bytes encrypted,
                             then 64 bytes encrypted / 6,336 bytes skipped
```

Notably, some files are not fully encrypted, possibly in an effort to hasten the encryption process. This is a deliberate design decision — encrypting just enough to render files unusable while maximizing throughput across an entire filesystem.

The partial encryption pattern is also what eventually enabled decryption without paying (more on that below).

### Multithreading

The ransomware also uses a multithreading approach to utilize multiple processors for speeding up the encryption process. In Ghidra, look for `CreateThread` calls that each receive a file path or file handle as an argument — each thread independently encrypts one file.

### Excluded Paths

The ransomware skips certain directories to keep the system bootable enough to display the ransom note:

```
\Windows\
\Program Files\
\Program Files (x86)\
\ProgramData\
\$Recycle.Bin\
\Boot\
\System Volume Information\
```

These exclusions are usually stored as hardcoded wide-character strings. In Ghidra, find them by looking for `wcsstr` or `wcscmp` calls in the directory enumeration loop.

---

## File Enumeration and Volume Traversal

To start encrypting files, Black Basta calls `FindFirstVolumeW()` and `FindNextVolumeW()` functions to enumerate volumes on the victim system. For each volume, the ransomware calls `GetVolumePathNamesForVolumeNameW()` to obtain a list of drive letters and mounted folder paths for the specified volume.

This approach catches network drives and mounted volumes that a simple `C:\` enumeration would miss — important for maximizing impact in enterprise environments.

The enumeration loop in pseudocode:

```c
WCHAR volume_name[MAX_PATH];
HANDLE hVol = FindFirstVolumeW(volume_name, MAX_PATH);

do {
    WCHAR path_names[4096];
    DWORD returned;
    GetVolumePathNamesForVolumeNameW(volume_name, path_names, 4096, &returned);

    // For each path, spawn encryption thread
    encrypt_directory_recursive(path_names);

} while (FindNextVolumeW(hVol, volume_name, MAX_PATH));

FindVolumeClose(hVol);
```

---

## Shadow Copy Deletion

Before encrypting, the ransomware binary uses `vssadmin.exe` to delete the shadow copy files to prevent system recovery.

```cmd
C:\Windows\SysNative\vssadmin.exe delete shadows /all /quiet
```

The `SysNative` path (rather than `System32`) is used to avoid file system redirection on 64-bit systems when the binary runs as a 32-bit process. Look for `CreateProcessW` or `ShellExecuteW` calls early in execution with this command string (obfuscated in later builds).

---

## Encryption Scheme: v2.0 (XChaCha20 + ECC)

Perhaps the most significant modification in Black Basta 2.0 is to the encryption algorithms. Previous versions used a per-victim asymmetric 4,096-bit RSA public key and a per-file ChaCha20 symmetric key. In the latest version, the encryption algorithms have been replaced with Elliptic Curve Cryptography (ECC) and XChaCha20. The elliptic curve used is NIST P-521 (aka secp521r1). The encryption library used is Crypto++.

The shift from RSA+GMP to ECC+Crypto++ has several implications for analysis:

- **Crypto++ is a well-known library** — you can use FLIRT signatures in IDA or Ghidra's function ID feature to recognize Crypto++ functions and auto-label them, which dramatically speeds up reversing the crypto code
- **XChaCha20 extends the nonce** from 8 to 24 bytes — look for the longer nonce buffer in the key generation code
- **NIST P-521 key material** is 66 bytes for the private scalar — ephemeral per-file keypairs are generated for the ECDH key agreement

Another difference is the file extension. Black Basta v1 used the self-named extension `.basta`. In v2, the file extension is a random 9-letter alphanumeric sequence per victim, such as `.agnkdbd5y`. This also means string-matching on `.basta` is insufficient for detection of newer samples.

---

## The Crypto Bug: How SRLabs Broke It

This is the most interesting part of the whole analysis.

The ransomware generates the same 64-byte keystream for every chunk to be encrypted. SRLabs tested this hypothesis by letting the malware encrypt a series of zero bytes followed by a series of one-bytes. If the same key was used, the difference (byte-wise XOR) of the encrypted bytes should be one (`0x01`) due to the commutative and self-inverse properties of XOR. The difference was indeed one, confirming the hypothesis. This was finally confirmed through reverse engineering the malware.

To understand the bug: XChaCha20 is a stream cipher. Correct usage generates a **unique keystream for each chunk** by incrementing a counter. Black Basta's `EncryptFile` routine re-initialized the cipher with the same key and nonce for each chunk instead of maintaining state across chunks. The result: **every 64-byte encrypted chunk in a file used the identical keystream**.

```
Correct:  chunk_0_ciphertext = plaintext XOR keystream[0..63]
          chunk_1_ciphertext = plaintext XOR keystream[64..127]  ← different

Buggy:    chunk_0_ciphertext = plaintext XOR keystream[0..63]
          chunk_1_ciphertext = plaintext XOR keystream[0..63]   ← same!
```

If you know the plaintext of **any** 64-byte chunk (e.g. a known file header), you can recover the keystream by XOR-ing the known plaintext with the ciphertext. Then XOR that keystream against every other encrypted chunk to recover the full file.

Files encrypted by Black Basta between November 2022 and December 2023 can be decrypted under certain circumstances with the tool provided on GitHub. After Black Basta changed their encryption routine in early December 2023, thereby fixing the vulnerability, researchers presented their findings publicly at 37C3 in Hamburg, Germany.

The fix was straightforward — maintain cipher state across chunks rather than re-initializing. But the bug existed in production for over a year.

---

## Post-Encryption Actions

After encryption completes, the binary:

1. **Drops the ransom note** — `readme.txt` (v1) or `instructions_read_me.txt` (v2) in each directory
2. **Changes the desktop wallpaper** — drops a `.jpg` to `%TEMP%` and sets it via registry:

```
HKCU\Control Panel\Desktop\Wallpaper
```

3. **Associates `.basta` extension with a custom icon** — drops a `.ico` to `%TEMP%` and writes:

```
HKCR\.basta\DefaultIcon
```

4. **Exits** — the ransomware process terminates cleanly; persistence isn't needed because the damage is already done

---

## YARA Rules for Detection

Based on the analysis above, a basic YARA rule targeting v1 samples:

```yara
rule BlackBasta_v1 {
    meta:
        description = "Detects Black Basta ransomware v1"
        author      = "r4r00t"
        reference   = "public research"

    strings:
        $mutex      = "dsajdhas.0" wide
        $ext        = ".basta" wide
        $vss        = "delete shadows /all /quiet" wide
        $safeboot   = "/set safeboot network" wide
        $note_v1    = "readme.txt" wide
        $note_v2    = "instructions_read_me.txt" wide
        $wallpaper  = "Control Panel\\Desktop\\Wallpaper" wide

        // ChaCha20 constant ("expand 32-byte k")
        $chacha_const = { 65 78 70 61 6E 64 20 33 32 2D 62 79 74 65 20 6B }

    condition:
        uint16(0) == 0x5A4D and
        filesize < 5MB and
        $mutex and
        $chacha_const and
        2 of ($ext, $vss, $safeboot, $note_v1, $note_v2, $wallpaper)
}
```

---

## IOCs (Historic — From Public Research)

**Known mutex**: `dsajdhas.0`

**SHA256 samples** (from public sources):
```
ae7c868713e1d02b4db60128c651eb1e3f6a33c02544cc4cb57c3aa6c6581b6e
```

**Registry modifications**:
```
HKCU\Control Panel\Desktop\Wallpaper
HKCR\.basta\DefaultIcon
HKLM\SYSTEM\CurrentControlSet\Control\SafeBoot\Network\Fax
```

**Commands executed**:
```cmd
vssadmin.exe delete shadows /all /quiet
bcdedit.exe /set safeboot network
shutdown -r -f -t 0
```

---

## MITRE ATT&CK Mapping

| Technique | ID | Notes |
|-----------|-----|-------|
| Phishing | T1566 | Initial access via spearphishing |
| Command and Scripting Interpreter | T1059 | PowerShell for C2 and lateral movement |
| Boot or Logon Autostart | T1547 | Service registered for safe mode autostart |
| Modify Registry | T1112 | Wallpaper, file icon, safeboot config |
| Inhibit System Recovery | T1490 | VSS deletion |
| Data Encrypted for Impact | T1486 | ChaCha20/XChaCha20 + RSA/ECC |
| Obfuscated Files or Information | T1027 | Stack strings, packed builds |
| Debugger Evasion | T1622 | IsDebuggerPresent, timing checks |
| Safe Mode Boot | T1562.009 | Reboot to safe mode to disable EDR |
| Service Stop | T1489 | Fax service hijack |

---

## Where to Get Samples

- **MalwareBazaar** — `https://bazaar.abuse.ch` — search `black basta`
- **VirusTotal** — historical samples via search or known hashes
- **Any.run** — live sandbox runs with full API traces

Always analyze in an isolated VM with no network access to your host. Snapshot before execution. If you're running the evasion build, snapshot before it can write to the boot configuration.

---

## Final Note

Black Basta is a well-engineered piece of ransomware — modular builds, fast encryption, thoughtful evasion. The safe mode trick in particular is elegant: instead of fighting EDR in ring 3, just reboot to an environment where EDR doesn't run.

The crypto bug is a reminder that even sophisticated operators make implementation mistakes. The ChaCha20 re-initialization flaw wasn't a design error — the algorithm choice was fine. It was a usage error: misunderstanding stream cipher statefulness. A code review or basic fuzzing would have caught it.

Both things can be true at once: the operators were technically capable, and they still shipped broken crypto for over a year.