from __future__ import annotations

import os

from pathlib import Path


PYTHON_DIR = (
    Path(__file__)
    .resolve()
    .parents[1]
)

STATE_DIR = (
    PYTHON_DIR
    / ".state"
)

LOCK_FILE = (
    STATE_DIR
    / "scraper.lock"
)


def _is_process_running(
    pid: int,
) -> bool:

    if pid <= 0:
        return False

    # ========================================================
    # Windows
    # ========================================================

    if os.name == "nt":

        import ctypes

        from ctypes import wintypes


        PROCESS_QUERY_LIMITED_INFORMATION = (
            0x1000
        )

        STILL_ACTIVE = 259


        kernel32 = ctypes.WinDLL(
            "kernel32",
            use_last_error=True,
        )


        kernel32.OpenProcess.argtypes = [
            wintypes.DWORD,
            wintypes.BOOL,
            wintypes.DWORD,
        ]

        kernel32.OpenProcess.restype = (
            wintypes.HANDLE
        )


        kernel32.GetExitCodeProcess.argtypes = [
            wintypes.HANDLE,
            ctypes.POINTER(
                wintypes.DWORD
            ),
        ]

        kernel32.GetExitCodeProcess.restype = (
            wintypes.BOOL
        )


        kernel32.CloseHandle.argtypes = [
            wintypes.HANDLE
        ]

        kernel32.CloseHandle.restype = (
            wintypes.BOOL
        )


        handle = kernel32.OpenProcess(
            PROCESS_QUERY_LIMITED_INFORMATION,
            False,
            pid,
        )


        if not handle:

            error = (
                ctypes.get_last_error()
            )

            # Access denied usually means
            # the process exists but cannot
            # be queried.
            if error == 5:
                return True

            return False


        try:

            exit_code = (
                wintypes.DWORD()
            )

            success = (
                kernel32
                .GetExitCodeProcess(
                    handle,
                    ctypes.byref(
                        exit_code
                    ),
                )
            )

            if not success:
                return True

            return (
                exit_code.value
                == STILL_ACTIVE
            )

        finally:

            kernel32.CloseHandle(
                handle
            )


    # ========================================================
    # Linux / macOS
    # ========================================================

    try:

        os.kill(
            pid,
            0,
        )

        return True

    except ProcessLookupError:
        return False

    except PermissionError:
        return True

    except OSError:
        return False


def _read_lock_pid() -> int | None:
    try:
        text = (
            LOCK_FILE
            .read_text(
                encoding="utf-8"
            )
            .strip()
        )

        return int(
            text
        )

    except (
        OSError,
        ValueError,
    ):
        return None


def acquire_run_lock() -> bool:
    STATE_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    # ========================================================
    # Existing lock
    # ========================================================

    if LOCK_FILE.exists():

        existing_pid = _read_lock_pid()

        if (
            existing_pid is not None
            and _is_process_running(
                existing_pid
            )
        ):
            print(
                "⚠️ Price Watch scraper "
                "is already running."
            )

            print(
                f"Existing PID: "
                f"{existing_pid}"
            )

            return False

        # Stale or invalid lock
        print(
            "⚠️ Stale scraper lock "
            "detected. Removing it."
        )

        LOCK_FILE.unlink(
            missing_ok=True
        )


    # ========================================================
    # Create lock atomically
    # ========================================================

    try:
        fd = os.open(
            LOCK_FILE,
            os.O_CREAT
            | os.O_EXCL
            | os.O_WRONLY,
        )

        with os.fdopen(
            fd,
            "w",
            encoding="utf-8",
        ) as file:

            file.write(
                str(
                    os.getpid()
                )
            )

        return True

    except FileExistsError:
        # Another process may have
        # created the lock between
        # our check and os.open().
        return False


def release_run_lock() -> None:
    try:

        current_pid = os.getpid()

        lock_pid = _read_lock_pid()

        # Only remove the lock if it
        # still belongs to this process.
        if lock_pid == current_pid:

            LOCK_FILE.unlink(
                missing_ok=True
            )

    except OSError:
        pass