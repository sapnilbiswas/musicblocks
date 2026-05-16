/**
 * MusicBlocks v3.6.2
 *
 * @author Lakshay
 *
 * @copyright 2026 Lakshay
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const PitchDrumMatrix = require("../pitchdrummatrix.js");

// --- Global Mocks ---
global._ = msg => msg;
global.platformColor = {
    labelColor: "#90c100",
    selectorBackground: "#f0f0f0",
    selectorBackgroundHOVER: "#e0e0e0"
};
global.docById = jest.fn(() => ({
    style: {},
    innerHTML: "",
    insertRow: jest.fn(() => ({
        insertCell: jest.fn(() => ({
            style: {},
            innerHTML: "",
            setAttribute: jest.fn(),
            addEventListener: jest.fn(),
            appendChild: jest.fn()
        })),
        setAttribute: jest.fn(),
        style: {}
    })),
    appendChild: jest.fn(),
    setAttribute: jest.fn()
}));
global.getNote = jest.fn(() => ["C", "", 4]);
global.getDrumName = jest.fn(() => null);
global.getDrumIcon = jest.fn(() => "icon.svg");
global.getDrumSynthName = jest.fn(() => "kick");
global.MATRIXSOLFEHEIGHT = 30;
global.MATRIXSOLFEWIDTH = 80;
global.SOLFEGECONVERSIONTABLE = {};
global.Singer = { RhythmActions: { getNoteValue: jest.fn(() => 0.25) } };

global.window = {
    innerWidth: 1200,
    widgetWindows: {
        windowFor: jest.fn().mockReturnValue({
            clear: jest.fn(),
            show: jest.fn(),
            addButton: jest.fn().mockReturnValue({ onclick: null }),
            getWidgetBody: jest.fn().mockReturnValue({
                append: jest.fn(),
                appendChild: jest.fn(),
                style: {}
            }),
            sendToCenter: jest.fn(),
            onclose: null,
            onmaximize: null,
            destroy: jest.fn()
        })
    }
};

global.document = {
    createElement: jest.fn(() => ({
        style: {},
        innerHTML: "",
        appendChild: jest.fn(),
        append: jest.fn(),
        setAttribute: jest.fn(),
        addEventListener: jest.fn()
    }))
};

describe("PitchDrumMatrix Widget", () => {
    let pdm;

    beforeEach(() => {
        pdm = new PitchDrumMatrix();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // --- Constructor Tests ---
    describe("constructor", () => {
        test("should initialize with empty rowLabels", () => {
            expect(pdm.rowLabels).toEqual([]);
        });

        test("should initialize with empty rowArgs", () => {
            expect(pdm.rowArgs).toEqual([]);
        });

        test("should initialize with empty drums", () => {
            expect(pdm.drums).toEqual([]);
        });

        test("should initialize _rests to 0", () => {
            expect(pdm._rests).toBe(0);
        });

        test("should initialize _playing to false", () => {
            expect(pdm._playing).toBe(false);
        });

        test("should initialize empty _rowBlocks", () => {
            expect(pdm._rowBlocks).toEqual([]);
        });

        test("should initialize empty _colBlocks", () => {
            expect(pdm._colBlocks).toEqual([]);
        });

        test("should initialize empty _blockMap", () => {
            expect(pdm._blockMap).toEqual([]);
        });
    });

    // --- Static Constants Tests ---
    describe("static constants", () => {
        test("should have correct BUTTONDIVWIDTH", () => {
            expect(PitchDrumMatrix.BUTTONDIVWIDTH).toBe(295);
        });

        test("should have correct DRUMNAMEWIDTH", () => {
            expect(PitchDrumMatrix.DRUMNAMEWIDTH).toBe(50);
        });

        test("should have correct OUTERWINDOWWIDTH", () => {
            expect(PitchDrumMatrix.OUTERWINDOWWIDTH).toBe(128);
        });

        test("should have correct INNERWINDOWWIDTH", () => {
            expect(PitchDrumMatrix.INNERWINDOWWIDTH).toBe(50);
        });

        test("should have correct BUTTONSIZE", () => {
            expect(PitchDrumMatrix.BUTTONSIZE).toBe(53);
        });

        test("should have correct ICONSIZE", () => {
            expect(PitchDrumMatrix.ICONSIZE).toBe(32);
        });
    });

    // --- Data Management Tests ---
    describe("data management", () => {
        test("should store row labels", () => {
            pdm.rowLabels.push("C");
            pdm.rowLabels.push("D");
            pdm.rowLabels.push("E");
            expect(pdm.rowLabels).toEqual(["C", "D", "E"]);
        });

        test("should store row args (octaves)", () => {
            pdm.rowArgs.push(4);
            pdm.rowArgs.push(4);
            pdm.rowArgs.push(5);
            expect(pdm.rowArgs).toEqual([4, 4, 5]);
        });

        test("should store drums", () => {
            pdm.drums.push("kick drum");
            pdm.drums.push("snare drum");
            expect(pdm.drums).toHaveLength(2);
        });

        test("should count rests", () => {
            pdm._rests = 0;
            pdm._rests += 1;
            pdm._rests += 1;
            expect(pdm._rests).toBe(2);
        });

        test("should store row block numbers", () => {
            pdm._rowBlocks.push(10);
            pdm._rowBlocks.push(20);
            expect(pdm._rowBlocks).toEqual([10, 20]);
        });

        test("should store column block numbers", () => {
            pdm._colBlocks.push(30);
            pdm._colBlocks.push(40);
            expect(pdm._colBlocks).toEqual([30, 40]);
        });

        test("should store block map entries", () => {
            pdm._blockMap.push([0, 1]);
            pdm._blockMap.push([1, 0]);
            expect(pdm._blockMap).toHaveLength(2);
            expect(pdm._blockMap[0]).toEqual([0, 1]);
        });
    });

    // --- Playing State Tests ---
    describe("playing state", () => {
        test("should toggle playing state", () => {
            expect(pdm._playing).toBe(false);
            pdm._playing = !pdm._playing;
            expect(pdm._playing).toBe(true);
            pdm._playing = !pdm._playing;
            expect(pdm._playing).toBe(false);
        });
    });

    // --- Save Lock Tests ---
    describe("save lock", () => {
        test("should initialize _save_lock as undefined before init", () => {
            // _save_lock is set in init, not constructor
            expect(pdm._save_lock).toBeUndefined();
        });

        test("_get_save_lock returns current lock state", () => {
            pdm._save_lock = false;
            expect(pdm._get_save_lock()).toBe(false);
            pdm._save_lock = true;
            expect(pdm._get_save_lock()).toBe(true);
        });
    });

    // --- clearBlocks Tests ---
    describe("clearBlocks", () => {
        test("should clear both row and column blocks", () => {
            pdm._rowBlocks = [1, 2, 3];
            pdm._colBlocks = [4, 5, 6];
            pdm.clearBlocks();
            expect(pdm._rowBlocks).toEqual([]);
            expect(pdm._colBlocks).toEqual([]);
        });

        test("should work when arrays are already empty", () => {
            pdm.clearBlocks();
            expect(pdm._rowBlocks).toEqual([]);
            expect(pdm._colBlocks).toEqual([]);
        });
    });

    // --- addRowBlock Tests ---
    describe("addRowBlock", () => {
        test("should add a pitch block to _rowBlocks", () => {
            pdm.addRowBlock(10);
            expect(pdm._rowBlocks).toEqual([10]);
        });

        test("should accumulate multiple pitch blocks", () => {
            pdm.addRowBlock(10);
            pdm.addRowBlock(20);
            pdm.addRowBlock(30);
            expect(pdm._rowBlocks).toEqual([10, 20, 30]);
        });
    });

    // --- addColBlock Tests ---
    describe("addColBlock", () => {
        test("should add a drum block to _colBlocks", () => {
            pdm.addColBlock(40);
            expect(pdm._colBlocks).toEqual([40]);
        });

        test("should accumulate multiple drum blocks", () => {
            pdm.addColBlock(40);
            pdm.addColBlock(50);
            expect(pdm._colBlocks).toEqual([40, 50]);
        });
    });

    // --- addNode Tests ---
    describe("addNode", () => {
        test("should add a pitch-drum mapping to _blockMap", () => {
            pdm.addNode(1, 2);
            expect(pdm._blockMap).toEqual([[1, 2]]);
        });

        test("should not add duplicate nodes", () => {
            pdm.addNode(1, 2);
            pdm.addNode(1, 2);
            expect(pdm._blockMap).toEqual([[1, 2]]);
        });

        test("should add different pitch-drum combinations", () => {
            pdm.addNode(1, 2);
            pdm.addNode(1, 3);
            pdm.addNode(2, 2);
            expect(pdm._blockMap).toHaveLength(3);
        });

        test("should allow same pitch with different drums", () => {
            pdm.addNode(5, 10);
            pdm.addNode(5, 20);
            expect(pdm._blockMap).toEqual([
                [5, 10],
                [5, 20]
            ]);
        });
    });

    // --- removeNode Tests ---
    describe("removeNode", () => {
        test("should mark a node as removed with [-1, -1]", () => {
            pdm.addNode(1, 2);
            pdm.removeNode(1, 2);
            expect(pdm._blockMap).toEqual([[-1, -1]]);
        });

        test("should not affect other nodes", () => {
            pdm.addNode(1, 2);
            pdm.addNode(3, 4);
            pdm.removeNode(1, 2);
            expect(pdm._blockMap).toEqual([
                [-1, -1],
                [3, 4]
            ]);
        });

        test("should do nothing if node does not exist", () => {
            pdm.addNode(1, 2);
            pdm.removeNode(5, 6);
            expect(pdm._blockMap).toEqual([[1, 2]]);
        });

        test("should handle removing from empty blockMap", () => {
            pdm.removeNode(1, 2);
            expect(pdm._blockMap).toEqual([]);
        });

        test("add then remove then re-add should create new entry", () => {
            pdm.addNode(1, 2);
            pdm.removeNode(1, 2);
            // addNode checks for exact match [1,2], but the entry is now [-1,-1]
            // so adding again should create a new entry
            pdm.addNode(1, 2);
            expect(pdm._blockMap).toHaveLength(2);
            expect(pdm._blockMap[0]).toEqual([-1, -1]);
            expect(pdm._blockMap[1]).toEqual([1, 2]);
        });
    });
});
