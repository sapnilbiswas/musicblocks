/**
 * MusicBlocks v3.4.1
 *
 * @author Sapnil Biswas
 *
 * @copyright 2026 Music Blocks contributors
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

// Globals required by GlobalTag before the module is loaded
global._ = jest.fn(str => str);
global.toTitleCase = jest.fn(str => str);

const { GlobalTag } = require("../GlobalTag");

describe("GlobalTag", () => {
    let mockGlobalPlanet;
    let mockPlanet;

    const makeTag = (overrides = {}) => {
        const tag = new GlobalTag(mockPlanet);
        Object.assign(tag, overrides);
        return tag;
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockGlobalPlanet = {
            selectSpecialTag: jest.fn(),
            refreshTagList: jest.fn()
        };

        mockPlanet = {
            GlobalPlanet: mockGlobalPlanet,
            TagsManifest: {
                42: { TagName: "Music", IsDisplayTag: "1" },
                99: { TagName: "Game", IsDisplayTag: "0" }
            }
        };

        // Provide minimal DOM for render()
        document.body.innerHTML = `
            <div id="primarychips"></div>
            <div id="morechips"></div>
        `;
    });

    // ─── constructor ────────────────────────────────────────────────────────────

    describe("constructor", () => {
        it("should initialise all properties to their defaults", () => {
            const tag = new GlobalTag(mockPlanet);

            expect(tag.Planet).toBe(mockPlanet);
            expect(tag.globalPlanet).toBe(mockGlobalPlanet);
            expect(tag.id).toBeNull();
            expect(tag.name).toBeNull();
            expect(tag.func).toBeNull();
            expect(tag.IsDisplayTag).toBeNull();
            expect(tag.specialTag).toBeNull();
            expect(tag.tagElement).toBeNull();
            expect(tag.selected).toBe(false);
            expect(tag.selectedClass).toBeNull();
        });
    });

    // ─── init() – regular tag (with id) ─────────────────────────────────────────

    describe("init() with a regular tag object (has id)", () => {
        it("should populate fields from TagsManifest and call render()", () => {
            const tag = new GlobalTag(mockPlanet);
            const renderSpy = jest.spyOn(tag, "render").mockImplementation(() => {});

            tag.init({ id: 42 });

            expect(tag.specialTag).toBe(false);
            expect(tag.id).toBe(42);
            expect(tag.name).toBe("Music");
            expect(tag.func).toBeNull();
            expect(tag.IsDisplayTag).toBe(true);
            expect(tag.selectedClass).toBe("selected");
            expect(renderSpy).toHaveBeenCalledTimes(1);
        });

        it("should set IsDisplayTag=false when TagsManifest flag is not '1'", () => {
            const tag = new GlobalTag(mockPlanet);
            jest.spyOn(tag, "render").mockImplementation(() => {});

            tag.init({ id: 99 });

            expect(tag.IsDisplayTag).toBe(false);
        });
    });

    // ─── init() – special tag (no id) ───────────────────────────────────────────

    describe("init() with a special tag object (no id)", () => {
        it("should populate special-tag fields and call render()", () => {
            const tag = new GlobalTag(mockPlanet);
            const renderSpy = jest.spyOn(tag, "render").mockImplementation(() => {});
            const myFunc = jest.fn();

            tag.init({ name: "All Projects", func: myFunc });

            expect(tag.specialTag).toBe(true);
            expect(tag.IsDisplayTag).toBe(true);
            expect(tag.id).toBeNull();
            expect(tag.name).toBe("All Projects");
            expect(tag.func).toBe(myFunc);
            expect(tag.selectedClass).toBe("selected-special");
            expect(renderSpy).toHaveBeenCalledTimes(1);
        });
    });

    // ─── render() ───────────────────────────────────────────────────────────────

    describe("render()", () => {
        it("should create a div with 'chipselect' and 'cursor' classes", () => {
            const tag = makeTag({
                name: "Art",
                IsDisplayTag: true,
                selected: false,
                selectedClass: "selected"
            });
            tag.render();

            const container = document.getElementById("primarychips");
            expect(container.children.length).toBe(1);
            const div = container.children[0];
            expect(div.classList.contains("chipselect")).toBe(true);
            expect(div.classList.contains("cursor")).toBe(true);
        });

        it("should add selectedClass to the element when tag is already selected", () => {
            const tag = makeTag({
                name: "Art",
                IsDisplayTag: true,
                selected: true,
                selectedClass: "selected"
            });
            tag.render();

            const div = document.getElementById("primarychips").children[0];
            expect(div.classList.contains("selected")).toBe(true);
        });

        it("should append to morechips when IsDisplayTag is false", () => {
            const tag = makeTag({
                name: "Game",
                IsDisplayTag: false,
                selected: false,
                selectedClass: "selected"
            });
            tag.render();

            expect(document.getElementById("morechips").children.length).toBe(1);
            expect(document.getElementById("primarychips").children.length).toBe(0);
        });

        it("should call toTitleCase and _ with the tag name", () => {
            const tag = makeTag({
                name: "music",
                IsDisplayTag: true,
                selected: false,
                selectedClass: "selected"
            });
            tag.render();

            expect(global._).toHaveBeenCalledWith("music");
            expect(global.toTitleCase).toHaveBeenCalledWith("music");
        });

        it("should set tagElement to the created div", () => {
            const tag = makeTag({
                name: "Art",
                IsDisplayTag: true,
                selected: false,
                selectedClass: "selected"
            });
            tag.render();

            expect(tag.tagElement).toBe(document.getElementById("primarychips").children[0]);
        });

        it("should invoke onTagClick() when the element is clicked", () => {
            const tag = makeTag({
                name: "Art",
                IsDisplayTag: true,
                selected: false,
                selectedClass: "selected"
            });
            tag.render();
            const clickSpy = jest.spyOn(tag, "onTagClick").mockImplementation(() => {});

            // Re-render so the spy is attached
            document.getElementById("primarychips").innerHTML = "";
            tag.render();
            tag.tagElement.click();

            expect(clickSpy).toHaveBeenCalledTimes(1);
        });
    });

    // ─── select() / unselect() ──────────────────────────────────────────────────

    describe("select()", () => {
        it("should add selectedClass and set selected=true", () => {
            const tag = makeTag({ selectedClass: "selected", selected: false });
            const div = document.createElement("div");
            tag.tagElement = div;

            tag.select();

            expect(div.classList.contains("selected")).toBe(true);
            expect(tag.selected).toBe(true);
        });
    });

    describe("unselect()", () => {
        it("should remove selectedClass and set selected=false", () => {
            const tag = makeTag({ selectedClass: "selected", selected: true });
            const div = document.createElement("div");
            div.classList.add("selected");
            tag.tagElement = div;

            tag.unselect();

            expect(div.classList.contains("selected")).toBe(false);
            expect(tag.selected).toBe(false);
        });
    });

    // ─── onTagClick() ───────────────────────────────────────────────────────────

    describe("onTagClick()", () => {
        it("should call globalPlanet.selectSpecialTag when specialTag=true and not selected", () => {
            const tag = makeTag({ specialTag: true, selected: false });

            tag.onTagClick();

            expect(mockGlobalPlanet.selectSpecialTag).toHaveBeenCalledWith(tag);
            expect(mockGlobalPlanet.refreshTagList).not.toHaveBeenCalled();
        });

        it("should NOT call selectSpecialTag when specialTag=true and already selected", () => {
            const tag = makeTag({
                specialTag: true,
                selected: true,
                selectedClass: "selected-special"
            });
            const div = document.createElement("div");
            div.classList.add("selected-special");
            tag.tagElement = div;

            tag.onTagClick();

            expect(mockGlobalPlanet.selectSpecialTag).not.toHaveBeenCalled();
            expect(mockGlobalPlanet.refreshTagList).toHaveBeenCalled();
        });

        it("should call select() and refreshTagList when specialTag=false and not selected", () => {
            const tag = makeTag({ specialTag: false, selected: false, selectedClass: "selected" });
            const div = document.createElement("div");
            tag.tagElement = div;

            tag.onTagClick();

            expect(div.classList.contains("selected")).toBe(true);
            expect(mockGlobalPlanet.refreshTagList).toHaveBeenCalled();
        });

        it("should call unselect() and refreshTagList when specialTag=false and already selected", () => {
            const tag = makeTag({ specialTag: false, selected: true, selectedClass: "selected" });
            const div = document.createElement("div");
            div.classList.add("selected");
            tag.tagElement = div;

            tag.onTagClick();

            expect(div.classList.contains("selected")).toBe(false);
            expect(mockGlobalPlanet.refreshTagList).toHaveBeenCalled();
        });
    });
});
