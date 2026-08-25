from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class RunMetadata(BaseModel):
    run_id: str

    started_at: datetime
    finished_at: datetime

    duration_seconds: float

    status: Literal[
        "success",
        "degraded",
        "failed",
    ]

    total_products: int
    successful: int
    failed: int
    suspicious: int


def build_run_metadata(
    *,
    run_id: str,
    started_at: datetime,
    finished_at: datetime,
    total_products: int,
    successful: int,
    failed: int,
    suspicious: int,
) -> RunMetadata:

    duration_seconds = (
        finished_at - started_at
    ).total_seconds()

    # Nothing succeeded
    if successful == 0:
        status = "failed"

    # Everything succeeded cleanly
    elif (
        failed == 0
        and suspicious == 0
    ):
        status = "success"

    # At least one product had a problem
    else:
        status = "degraded"

    return RunMetadata(
        run_id=run_id,
        started_at=started_at,
        finished_at=finished_at,
        duration_seconds=round(
            duration_seconds,
            2,
        ),
        status=status,
        total_products=total_products,
        successful=successful,
        failed=failed,
        suspicious=suspicious,
    )