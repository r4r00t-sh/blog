---
title: "Waking the Dead: Windows Process Injection Explained"
date: "2026-03-21"
author: "r4r00t"
topic: "Security"
difficulty: "Intermediate"
summary: "How Windows process injection techniques work, why they're effective, and what defenders monitor to catch them."
---

Process injection is the practice of running code inside another process's address space. The host process supplies the memory, the identity, and the execution context. You supply the payload.

This post covers how the major Windows injection techniques work, what makes them detectable, and what defenders look for — because understanding the detection surface is part of understanding the technique.

---

## Why Process Injection

A standalone process is attributable. It has a path on disk, a process entry, and network connections tied directly to it. Defenders can hash it, sandbox it, and baseline it.

Injected code borrows the host process's identity. Network connections appear to come from `svchost.exe`. File access is attributed to `explorer.exe`. The payload has no image on disk.

The tradeoff is complexity: injection requires precise interaction with Windows memory management and the threading model — and those interactions are heavily monitored.

---

## Prerequisites: Handles and Memory

Everything starts with an `OpenProcess` call. The access rights requested are the first signal:

```c
HANDLE hProcess = OpenProcess(
    PROCESS_VM_READ    |
    PROCESS_VM_WRITE   |
    PROCESS_VM_OPERATION,
    FALSE,
    target_pid
);
```

`PROCESS_ALL_ACCESS` is maximally capable and maximally loud. Requesting the minimum rights needed is better operational practice — and it's also what defenders look for: a process requesting high-privilege handles on unrelated processes is anomalous.

Finding a target PID:

```c
DWORD find_pid(const char *procname) {
    HANDLE snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    PROCESSENTRY32 entry = { .dwSize = sizeof(PROCESSENTRY32) };

    if (Process32First(snap, &entry)) {
        do {
            if (_stricmp(entry.szExeFile, procname) == 0) {
                CloseHandle(snap);
                return entry.th32ProcessID;
            }
        } while (Process32Next(snap, &entry));
    }

    CloseHandle(snap);
    return 0;
}
```

Allocating memory in a remote process:

```c
// Allocate RW, write payload, then flip to RX — avoid RWX at rest
LPVOID remote_buf = VirtualAllocEx(hProcess, NULL, payload_len,
    MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);

SIZE_T written;
WriteProcessMemory(hProcess, remote_buf, shellcode, payload_len, &written);

DWORD old;
VirtualProtectEx(hProcess, remote_buf, payload_len, PAGE_EXECUTE_READ, &old);
```

`PAGE_EXECUTE_READWRITE` memory in a remote process is one of the highest-signal detections in Windows security tooling. Writing RW then flipping to RX is less anomalous — but the `VirtualProtectEx` call itself is still logged.

---

## Technique 1: CreateRemoteThread

Write shellcode into a remote process, then create a thread pointing at it.

```c
HANDLE hThread = CreateRemoteThread(
    hProcess,
    NULL,
    0,
    (LPTHREAD_START_ROUTINE)remote_buf,
    NULL,
    0,
    NULL
);
WaitForSingleObject(hThread, 2000);
CloseHandle(hThread);
```

**How it works**: `CreateRemoteThread` is a documented Win32 API that calls `NtCreateThreadEx` internally. The new thread begins executing at the address you supply.

**Detection**: This is the most well-known injection sequence in existence. The chain `OpenProcess` → `VirtualAllocEx` → `WriteProcessMemory` → `CreateRemoteThread` is what most injection detection signatures are built around. Sysmon Event ID 8 logs remote thread creation with source/target process and start address. EDRs hook both the Win32 and NTAPI layers. `PAGE_EXECUTE_READ` memory in a foreign process that was recently `PAGE_READWRITE` is a strong behavioral signal.

---

## Technique 2: APC Injection

Asynchronous Procedure Calls let you queue work to an existing thread. When the thread enters an *alertable wait* (`SleepEx`, `WaitForSingleObjectEx`, etc.), the kernel drains its APC queue and executes registered callbacks.

```c
// Enumerate threads belonging to the target PID
HANDLE snap = CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD, 0);
THREADENTRY32 te = { .dwSize = sizeof(THREADENTRY32) };

if (Thread32First(snap, &te)) {
    do {
        if (te.th32OwnerProcessID == pid) {
            HANDLE hThread = OpenThread(THREAD_SET_CONTEXT, FALSE, te.th32ThreadID);
            if (hThread) {
                QueueUserAPC((PAPCFUNC)remote_buf, hThread, 0);
                CloseHandle(hThread);
            }
        }
    } while (Thread32Next(snap, &te));
}
```

**How it works**: `QueueUserAPC` inserts the function pointer into the thread's APC queue. Execution is deferred until the thread yields in an alertable state — no new thread is created.

**Reliability limitation**: If no thread in the target enters an alertable wait, the APC never fires. This is the primary weakness. Worker threads in service processes (`svchost.exe`) tend to call alertable waits frequently; UI processes like `notepad.exe` do not.

**Early-Bird variant**: Create the process yourself in a suspended state, inject before resuming. The main thread calls `NtTestAlert` on first resume, which drains the APC queue before any user code runs:

```c
CreateProcessA("C:\\Windows\\System32\\RuntimeBroker.exe",
    NULL, NULL, NULL, FALSE, CREATE_SUSPENDED, NULL, NULL, &si, &pi);

// Write shellcode, queue APC to pi.hThread, then:
ResumeThread(pi.hThread);
```

**Detection**: `QueueUserAPC` is logged via ETW. The combination of a cross-process `WriteProcessMemory` followed by `QueueUserAPC` from an unrelated process is a reliable behavioral indicator. Early-bird variants are caught by monitoring process creation with `CREATE_SUSPENDED` followed immediately by memory writes to the new process.

---

## Technique 3: Process Hollowing

Create a legitimate process suspended, unmap its image, replace it with your payload, and resume.

```c
// 1. Create target suspended
CreateProcessA("C:\\Windows\\System32\\svchost.exe",
    NULL, NULL, NULL, FALSE, CREATE_SUSPENDED, NULL, NULL, &si, &pi);

// 2. Unmap the legitimate image
pNtUnmapViewOfSection NtUnmap = GetProcAddress(
    GetModuleHandleA("ntdll.dll"), "NtUnmapViewOfSection");
NtUnmap(pi.hProcess, image_base);  // image_base read from PEB

// 3. Allocate space at payload's preferred base
LPVOID remote_image = VirtualAllocEx(pi.hProcess,
    (PVOID)nt->OptionalHeader.ImageBase,
    nt->OptionalHeader.SizeOfImage,
    MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);

// 4. Write PE headers and sections, update PEB, fix entry point, resume
ctx.Rcx = (DWORD64)remote_image + nt->OptionalHeader.AddressOfEntryPoint;
SetThreadContext(pi.hThread, &ctx);
ResumeThread(pi.hThread);
```

**How it works**: From Task Manager and most enumeration tools, the process looks like `svchost.exe`. The code running is the payload. The PEB still lists the original image path.

**Detection**: `NtUnmapViewOfSection` on a process's own primary image immediately after creation is a very specific and unusual operation — monitored by every serious EDR. Modern detections also compare the in-memory PE headers against the on-disk image. Mismatches (e.g. a different `ImageBase`, different section names, or a missing `MZ` signature at the expected address) are reliable hollowing indicators. Sysmon can be configured to log image load events that enable this comparison.

---

## Technique 4: Reflective DLL Injection

Instead of injecting raw shellcode, inject a full DLL that contains its own loader. The reflective loader finds the DLL's own base address in memory, resolves its imports, applies relocations, and calls `DllMain` — without ever calling `LoadLibrary`.

```c
// Injector side: write the DLL blob and start a thread at the loader offset
SIZE_T loader_offset = find_export_offset(dll_buf, "ReflectiveLoader");

LPVOID remote_buf = VirtualAllocEx(hProcess, NULL, dll_size,
    MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
WriteProcessMemory(hProcess, remote_buf, dll_buf, dll_size, NULL);

LPTHREAD_START_ROUTINE loader =
    (LPTHREAD_START_ROUTINE)((ULONG_PTR)remote_buf + loader_offset);
CreateRemoteThread(hProcess, NULL, 0, loader, NULL, 0, NULL);
```

**How it works**: Because `LoadLibrary` is never called, the DLL doesn't appear in the process's loaded module list. `EnumProcessModules` and `CreateToolhelp32Snapshot(TH32CS_SNAPMODULE)` won't find it.

**Detection**: The injected DLL still occupies a `MEM_PRIVATE` executable region — not a `MEM_IMAGE` region like a normally loaded DLL. Memory scanners that walk a process's VAD (Virtual Address Descriptor) tree looking for executable `MEM_PRIVATE` regions will find it. EDRs that maintain their own module lists (separate from the OS-provided ones) catch the discrepancy. The reflective loader itself also has detectable behavioral patterns during the self-mapping phase.

---

## Module Stomping

Rather than allocating new executable memory, overwrite the `.text` section of an already-loaded DLL with your shellcode. The memory was already mapped executable; no new allocation is needed.

```c
// Find the .text section of a loaded but idle DLL in the target process
// Then: flip to RW, write payload, flip back to RX
DWORD old;
VirtualProtectEx(hProcess, text_section_addr, payload_len, PAGE_READWRITE, &old);
WriteProcessMemory(hProcess, text_section_addr, shellcode, payload_len, NULL);
VirtualProtectEx(hProcess, text_section_addr, payload_len, PAGE_EXECUTE_READ, &old);
```

**How it works**: The memory region type remains `MEM_IMAGE`, not `MEM_PRIVATE`. Heuristics that flag newly allocated RX memory don't apply.

**Detection**: The in-memory content of the DLL no longer matches the on-disk file. Integrity checking tools and EDR memory scanners that compare mapped sections against the original file will catch this. The `VirtualProtectEx` call on a `MEM_IMAGE` region — flipping it to writable — is itself logged and unusual. Stomping a DLL that other code actually calls also causes crashes, which is a different kind of signal.

---

## What Gets Logged

Understanding the telemetry is part of understanding the technique:

| Action | Telemetry Source |
|--------|-----------------|
| `OpenProcess` with high rights on unrelated process | ETW (Kernel-Process), EDR |
| `VirtualAllocEx` in remote process | ETW, EDR memory tracking |
| `WriteProcessMemory` | ETW, EDR |
| `CreateRemoteThread` | Sysmon Event ID 8, ETW, EDR |
| `QueueUserAPC` cross-process | ETW |
| `NtUnmapViewOfSection` on primary image | EDR ntdll hook |
| `MEM_PRIVATE` RX region in process | EDR memory scanner |
| In-memory PE doesn't match on-disk file | EDR integrity check |
| Module absent from OS list but present in VAD | EDR module enumeration |

ETW (Event Tracing for Windows) is the underlying telemetry bus. Many of the NTAPI functions involved have ETW instrumentation that feeds into Windows Defender, third-party EDRs, and forwarded event logs. The Win32 layer sits on top of NTAPI — both layers are typically monitored.

---

## Detection in Practice

For defenders, the practical detection approach is layered:

**Sysmon** provides event IDs for remote thread creation (8), memory allocation patterns, and image loads. A tuned Sysmon configuration is a solid baseline for catching unsophisticated injection.

**Memory scanning** — walking the VAD tree looking for `MEM_PRIVATE` executable regions, or regions where the in-memory content doesn't match the backing file — catches most shellcode injection and module stomping. This is what commercial EDR memory scanners do continuously.

**Behavioral correlation** — the sequence of API calls matters as much as any single call. An `OpenProcess` on `lsass.exe` by `notepad.exe` followed by `WriteProcessMemory` is a high-confidence indicator regardless of what comes next.

**ETW-based telemetry** — tools like Process Monitor, WEF/SIEM pipelines, or eBPF equivalents on Linux can capture the full API call sequence in real time.

---

## Final Note

Process injection is a well-documented technique because it's been in offensive tooling for decades and the detection landscape has matured around it. The fundamentals are stable: you need a handle, memory, and execution. Each step in that chain leaves traces in Windows telemetry.

Understanding both sides — how the injection works and what it leaves behind — is what makes this useful to study. The techniques above are covered in public malware analysis, red team tooling documentation, and academic research. The goal here is to make both sides of that picture clear.