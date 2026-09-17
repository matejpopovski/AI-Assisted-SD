export function cameraY(centerY: number, mapHeight: number, viewportHeight = 600): number {
    if (mapHeight <= viewportHeight) return (viewportHeight - mapHeight) / 2;
    return Math.trunc(
        Math.max(viewportHeight - mapHeight, Math.min(0, viewportHeight / 2 - centerY))
    );
}

export function visibleRows(offsetY: number, rows: number, tileSize = 64): [number, number] {
    return [
        Math.max(0, Math.floor(-offsetY / tileSize)),
        Math.min(rows - 1, Math.floor((600 - offsetY) / tileSize)),
    ];
}
