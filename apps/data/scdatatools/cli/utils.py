from typing import *

from rich import progress

try:
    import bpy

    IN_BLENDER = True
except ImportError:
    IN_BLENDER = False


class FractionColumn(progress.ProgressColumn):
    """Renders completed/total, e.g. '0.5/2.3 G'."""

    def __init__(self, unit_scale=False, unit_divisor=1000):
        self.unit_scale = unit_scale
        self.unit_divisor = unit_divisor
        super().__init__()

    def render(self, task):
        """Calculate common unit for completed and total."""
        completed = int(task.completed)
        total = int(task.total)
        if self.unit_scale:
            unit, suffix = progress.filesize.pick_unit_and_suffix(
                total,
                ["", "K", "M", "G", "T", "P", "E", "Z", "Y"],
                self.unit_divisor,
            )
        else:
            unit, suffix = progress.filesize.pick_unit_and_suffix(total, [""], 1)
        precision = 0 if unit == 1 else 1
        return progress.Text(
            f"{completed / unit:,.{precision}f}/{total / unit:,.{precision}f} {suffix}",
            style="progress.download",
        )


class RateColumn(progress.ProgressColumn):
    """Renders human readable transfer speed."""

    def __init__(self, unit="", unit_scale=False, unit_divisor=1000):
        self.unit = unit
        self.unit_scale = unit_scale
        self.unit_divisor = unit_divisor
        super().__init__()

    def render(self, task):
        """Show data transfer speed."""
        speed = task.speed
        if speed is None:
            return progress.Text(f"? {self.unit}/s", style="progress.data.speed")
        if self.unit_scale:
            unit, suffix = progress.filesize.pick_unit_and_suffix(
                speed,
                ["", "K", "M", "G", "T", "P", "E", "Z", "Y"],
                self.unit_divisor,
            )
        else:
            unit, suffix = progress.filesize.pick_unit_and_suffix(speed, [""], 1)
        precision = 0 if unit == 1 else 1
        return progress.Text(
            f"{speed / unit:,.{precision}f} {suffix}{self.unit}/s", style="progress.data.speed"
        )


def track(
        sequence: Union[Sequence[progress.ProgressType], Iterable[progress.ProgressType]],
        description: str = "Working...",
        total: Optional[float] = None,
        auto_refresh: bool = True,
        console: Optional[progress.Console] = None,
        transient: bool = False,
        get_time: Optional[Callable[[], float]] = None,
        refresh_per_second: float = 10,
        style: progress.StyleType = "bar.back",
        complete_style: progress.StyleType = "bar.complete",
        finished_style: progress.StyleType = "bar.finished",
        pulse_style: progress.StyleType = "bar.pulse",
        update_period: float = 0.1,
        disable: bool = False,
        show_speed: bool = True,
        unit: str = "i",
        unit_scale: bool = True,
) -> Iterable[progress.ProgressType]:
    """Track progress by iterating over a sequence.

    Args:
        sequence (Iterable[ProgressType]): A sequence (must support "len") you wish to iterate over.
        description (str, optional): Description of task show next to progress bar. Defaults to "Working".
        total: (float, optional): Total number of steps. Default is len(sequence).
        auto_refresh (bool, optional): Automatic refresh, disable to force a refresh after each iteration. Default is True.
        transient: (bool, optional): Clear the progress on exit. Defaults to False.
        console (Console, optional): Console to write to. Default creates internal Console instance.
        refresh_per_second (float): Number of times per second to refresh the progress information. Defaults to 10.
        style (StyleType, optional): Style for the bar background. Defaults to "bar.back".
        complete_style (StyleType, optional): Style for the completed bar. Defaults to "bar.complete".
        finished_style (StyleType, optional): Style for a finished bar. Defaults to "bar.done".
        pulse_style (StyleType, optional): Style for pulsing bars. Defaults to "bar.pulse".
        update_period (float, optional): Minimum time (in seconds) between calls to update(). Defaults to 0.1.
        disable (bool, optional): Disable display of progress.
        show_speed (bool, optional): Show speed if total isn't known. Defaults to True.
        unit (str, optional): Unit to show in the rate output. Defaults to i
    Returns:
        Iterable[ProgressType]: An iterable of the values in the sequence.

    """

    columns: List["ProgressColumn"] = [] if IN_BLENDER else [progress.SpinnerColumn()]
    columns.extend(
        [progress.TextColumn("[progress.description]{task.description}")] if description else []
    )
    columns.extend(
        (
            progress.BarColumn(
                style=style,
                complete_style=complete_style,
                finished_style=finished_style,
                pulse_style=pulse_style,
            ),
            progress.MofNCompleteColumn(),
            progress.TaskProgressColumn(
                text_format="[progress.percentage]{task.percentage:>3.0f}%", show_speed=show_speed
            ),
            RateColumn(unit=unit, unit_scale=unit_scale),
            progress.TimeRemainingColumn(),
        )
    )
    p = progress.Progress(
        *columns,
        auto_refresh=auto_refresh,
        console=console,
        transient=transient,
        get_time=get_time,
        refresh_per_second=refresh_per_second or 10,
        disable=disable,
    )

    with p:
        yield from p.track(
            sequence, total=total, description=description, update_period=update_period
        )
