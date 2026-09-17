import { GameMap } from "./GameMap.js";
import { CreatureState } from "./sprites/Creature.js";

export const CONTROL_LINES = [
    "Left / Right Arrow: Move",
    "Space: Jump; press again in the air to double jump",
    "Q: Qi Wave — 3 second cooldown",
    "Shift: Dash — quick burst, 1.2 second cooldown",
    "M: Menu / Settings    Escape: Fullscreen",
    "I: Show / Hide Instructions",
    "On completion — Y: Replay    U: Return to Menu",
];

export function drawHud(map: GameMap) {
    map.qiWave.drawHud(map.resources.getLoad("qiWaveIcon"));
    push();
    noStroke();
    fill(20, 24, 32, 220);
    rect(16, 100, 68, 40, 8);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(11);
    text("DASH", 50, 111);
    textSize(13);
    text(
        map.player.dash.cooldownRemaining > 0
            ? (map.player.dash.cooldownRemaining / 1000).toFixed(1)
            : "Rdy",
        50,
        127
    );
    fill(15, 25, 37, 215);
    rect(98, 16, 228, 80, 8);
    fill(255);
    textAlign(LEFT, TOP);
    textSize(18);
    text(`Score: ${map.score}`, 110, 25);
    textSize(12);
    fill(226, 218, 168);
    text(`Map ${map.level + 1}`, 110, 53);
    for (const [key, remaining, x] of [
        ["boots", map.player.bootsRemaining, 344],
        ["shield", map.player.shieldRemaining, 410],
    ] as [string, number, number][]) {
        fill(15, 25, 37, 215);
        rect(x, 16, 58, 80, 8);
        if (remaining <= 0) tint(110, 140);
        image(map.resources.getLoad(key), x + 7, 21, 44, 44);
        noTint();
        fill(255);
        textSize(14);
        textAlign(CENTER, TOP);
        text(remaining > 0 ? `${Math.ceil(remaining / 1000)}s` : "—", x + 29, 72);
    }
    if (map.boss && map.boss.active && map.boss.getState() === CreatureState.NORMAL) {
        fill(15, 25, 37, 220);
        rect(485, 16, 299, 66, 8);
        fill(255, 216, 133);
        textSize(18);
        textAlign(CENTER, TOP);
        text(`HAAAA  ${"♥".repeat(map.boss.hp)}`, 634, 24);
        fill(255);
        textSize(12);
        text(
            map.boss.laserPhase === "warning"
                ? "LASER LOCKED — MOVE!"
                : "Stomp or Qi Wave to strike",
            634,
            52
        );
    }
    fill(10, 20, 30, 200);
    rect(12, 574, 225, 23, 4);
    fill(255);
    textAlign(LEFT, TOP);
    textSize(13);
    text("Press I for Instructions", 22, 578);
    pop();
}

export function drawInstructions() {
    push();
    noStroke();
    fill(10, 18, 30, 235);
    rect(105, 130, 590, 330, 12);
    textAlign(LEFT, TOP);
    fill(255, 225, 150);
    textSize(26);
    text("The path to Guangming Summit", 130, 150);
    fill(255);
    textSize(17);
    CONTROL_LINES.forEach((s, i) => text(s, 130, 204 + i * 34));
    pop();
}

export function drawFinished(map: GameMap) {
    push();
    noStroke();
    fill(8, 15, 26, 215);
    rect(0, 0, 800, 600);
    image(map.resources.getLoad("trophy"), 352, 115, 96, 96);
    fill(255, 221, 139);
    textAlign(CENTER, CENTER);
    textSize(44);
    text("Congratulations!", 400, 265);
    fill(255);
    textSize(24);
    text(`Final Score: ${map.score}`, 400, 320);
    textSize(20);
    text("Y: Replay", 400, 385);
    text("U: Return to Menu", 400, 425);
    pop();
}
