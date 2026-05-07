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

global._ = jest.fn(str => str);
global.getCookie = jest.fn().mockReturnValue("");
global.setCookie = jest.fn();
global.StringHelper = jest.fn().mockImplementation(() => ({
    init: jest.fn()
}));
global.ProjectStorage = jest.fn().mockImplementation(() => ({
    init: jest.fn().mockResolvedValue(undefined),
    generateID: jest.fn().mockReturnValue("generated-id"),
    getCurrentProjectID: jest.fn().mockReturnValue("proj-1"),
    getCurrentProjectData: jest.fn().mockResolvedValue(null)
}));
global.ServerInterface = jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    getTagManifest: jest.fn()
}));
global.Converter = jest.fn().mockImplementation(() => ({
    init: jest.fn()
}));
global.SaveInterface = jest.fn().mockImplementation(() => ({
    init: jest.fn()
}));
global.LocalPlanet = jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    setCurrentProjectImage: jest.fn(),
    updateProjects: jest.fn()
}));
global.GlobalPlanet = jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    openGlobalProject: jest.fn()
}));

const { Planet } = require("../Planet");

describe("Planet", () => {
    let planet;
    let mockStorage;

    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = `
            <div id="close-planet"></div>
            <div id="planet-open-file"></div>
            <div id="planet-new-project"></div>
            <div id="new-project-confirmation"></div>
        `;
        mockStorage = {};
        planet = new Planet(true, mockStorage);
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    describe("constructor", () => {
        it("should initialize with correct default values", () => {
            expect(planet.LocalPlanet).toBeNull();
            expect(planet.GlobalPlanet).toBeNull();
            expect(planet.ProjectStorage).toBeNull();
            expect(planet.ServerInterface).toBeNull();
            expect(planet.Converter).toBeNull();
            expect(planet.SaveInterface).toBeNull();
            expect(planet.LocalStorage).toBe(mockStorage);
            expect(planet.ConnectedToServer).toBeNull();
            expect(planet.TagsManifest).toBeNull();
            expect(planet.IsMusicBlocks).toBe(true);
            expect(planet.UserIDCookie).toBe("UserID");
            expect(planet.UserID).toBeNull();
        });

        it("should accept IsMusicBlocks as false", () => {
            const turtlePlanet = new Planet(false, mockStorage);
            expect(turtlePlanet.IsMusicBlocks).toBe(false);
        });

        it("should initialize function hooks to null", () => {
            expect(planet.loadProjectFromData).toBeNull();
            expect(planet.loadNewProject).toBeNull();
            expect(planet.planetClose).toBeNull();
            expect(planet.oldCurrentProjectID).toBeNull();
            expect(planet.loadProjectFromFile).toBeNull();
        });
    });

    describe("prepareUserID", () => {
        it("should generate and set new ID when no cookie exists", () => {
            global.getCookie.mockReturnValue("");
            planet.ProjectStorage = {
                generateID: jest.fn().mockReturnValue("new-id")
            };

            planet.prepareUserID();

            expect(global.setCookie).toHaveBeenCalledWith("UserID", "new-id", 3650);
            expect(planet.UserID).toBe("new-id");
        });

        it("should use existing cookie ID when one exists", () => {
            global.getCookie.mockReturnValue("existing-id");
            planet.ProjectStorage = {
                generateID: jest.fn()
            };

            planet.prepareUserID();

            expect(planet.UserID).toBe("existing-id");
            expect(global.setCookie).not.toHaveBeenCalled();
            expect(planet.ProjectStorage.generateID).not.toHaveBeenCalled();
        });
    });

    describe("open", () => {
        it("should update LocalPlanet when available", () => {
            planet.LocalPlanet = {
                setCurrentProjectImage: jest.fn(),
                updateProjects: jest.fn()
            };
            planet.ProjectStorage = {
                getCurrentProjectID: jest.fn().mockReturnValue("proj-1")
            };

            planet.open("image-data");

            expect(planet.LocalPlanet.setCurrentProjectImage).toHaveBeenCalledWith("image-data");
            expect(planet.LocalPlanet.updateProjects).toHaveBeenCalled();
            expect(planet.oldCurrentProjectID).toBe("proj-1");
        });

        it("should log warning when LocalPlanet is null", () => {
            const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
            planet.LocalPlanet = null;
            planet.open("image-data");
            expect(warnSpy).toHaveBeenCalledWith("Local Planet unavailable");
            warnSpy.mockRestore();
        });
    });

    describe("saveLocally", () => {
        it("should delegate to ProjectStorage.saveLocally", () => {
            planet.ProjectStorage = { saveLocally: jest.fn() };
            planet.saveLocally("data", "image");
            expect(planet.ProjectStorage.saveLocally).toHaveBeenCalledWith("data", "image");
        });
    });

    describe("setter methods", () => {
        it("setAnalyzeProject should set analyzeProject", () => {
            const fn = jest.fn();
            planet.setAnalyzeProject(fn);
            expect(planet.analyzeProject).toBe(fn);
        });

        it("setLoadProjectFromData should set loadProjectFromData", () => {
            const fn = jest.fn();
            planet.setLoadProjectFromData(fn);
            expect(planet.loadProjectFromData).toBe(fn);
        });

        it("setPlanetClose should set planetClose", () => {
            const fn = jest.fn();
            planet.setPlanetClose(fn);
            expect(planet.planetClose).toBe(fn);
        });

        it("setLoadNewProject should set loadNewProject", () => {
            const fn = jest.fn();
            planet.setLoadNewProject(fn);
            expect(planet.loadNewProject).toBe(fn);
        });

        it("setLoadProjectFromFile should set loadProjectFromFile", () => {
            const fn = jest.fn();
            planet.setLoadProjectFromFile(fn);
            expect(planet.loadProjectFromFile).toBe(fn);
        });

        it("setOnConverterLoad should set onConverterLoad", () => {
            const fn = jest.fn();
            planet.setOnConverterLoad(fn);
            expect(planet.onConverterLoad).toBe(fn);
        });
    });

    describe("openProjectFromPlanet", () => {
        it("should delegate to GlobalPlanet.openGlobalProject", () => {
            planet.GlobalPlanet = { openGlobalProject: jest.fn() };
            const errorFn = jest.fn();
            planet.openProjectFromPlanet("proj-1", errorFn);
            expect(planet.GlobalPlanet.openGlobalProject).toHaveBeenCalledWith("proj-1", errorFn);
        });
    });

    describe("showNewProjectConfirmation", () => {
        it("should create a modal overlay in the document body", () => {
            // Mock window.parent.platformColor
            Object.defineProperty(window, "parent", {
                value: {
                    platformColor: {
                        dialogueBox: "#ffffff",
                        textColor: "#000000",
                        headingColor: "#333333",
                        blueButton: "#2196F3",
                        blueButtonText: "#ffffff",
                        cancelButton: "#cccccc"
                    }
                },
                writable: true
            });

            planet.loadNewProject = jest.fn();
            planet.showNewProjectConfirmation();

            const overlay = document.getElementById("new-project-confirmation");
            expect(overlay).not.toBeNull();
            expect(overlay.style.position).toBe("fixed");
        });

        it("should remove existing confirmation before creating a new one", () => {
            Object.defineProperty(window, "parent", {
                value: {
                    platformColor: {
                        dialogueBox: "#fff",
                        textColor: "#000",
                        headingColor: "#333",
                        blueButton: "#00f",
                        blueButtonText: "#fff",
                        cancelButton: "#ccc"
                    }
                },
                writable: true
            });

            planet.loadNewProject = jest.fn();
            planet.showNewProjectConfirmation();
            planet.showNewProjectConfirmation();

            const overlays = document.querySelectorAll("#new-project-confirmation");
            expect(overlays.length).toBe(1);
        });
    });

    describe("initPlanets", () => {
        it("should set ConnectedToServer to true when tags succeed", () => {
            planet.onConverterLoad = jest.fn();
            planet.initPlanets({ success: true, data: { 1: { TagName: "Music" } } });

            expect(planet.ConnectedToServer).toBe(true);
            expect(planet.TagsManifest).toEqual({ 1: { TagName: "Music" } });
        });

        it("should set ConnectedToServer to false when tags fail", () => {
            planet.onConverterLoad = jest.fn();
            planet.initPlanets({ success: false });

            expect(planet.ConnectedToServer).toBe(false);
            expect(planet.TagsManifest).toBeNull();
        });

        it("should initialize all subsystems", () => {
            planet.onConverterLoad = jest.fn();
            planet.initPlanets({ success: true, data: {} });

            expect(global.Converter).toHaveBeenCalled();
            expect(global.SaveInterface).toHaveBeenCalled();
            expect(global.LocalPlanet).toHaveBeenCalled();
            expect(global.GlobalPlanet).toHaveBeenCalled();
        });
    });

    describe("closeButton", () => {
        it("should call planetClose when project ID has not changed", async () => {
            planet.ProjectStorage = {
                getCurrentProjectID: jest.fn().mockReturnValue("proj-1"),
                getCurrentProjectData: jest.fn().mockResolvedValue(null)
            };
            planet.oldCurrentProjectID = "proj-1";
            planet.planetClose = jest.fn();

            await planet.closeButton();

            expect(planet.planetClose).toHaveBeenCalled();
        });

        it("should load new project when data is null and ID changed", async () => {
            planet.ProjectStorage = {
                getCurrentProjectID: jest.fn().mockReturnValue("proj-2"),
                getCurrentProjectData: jest.fn().mockResolvedValue(null)
            };
            planet.oldCurrentProjectID = "proj-1";
            planet.loadNewProject = jest.fn();

            await planet.closeButton();

            expect(planet.loadNewProject).toHaveBeenCalled();
        });

        it("should loadProjectFromData when data exists and ID changed", async () => {
            planet.ProjectStorage = {
                getCurrentProjectID: jest.fn().mockReturnValue("proj-2"),
                getCurrentProjectData: jest.fn().mockResolvedValue("project-data")
            };
            planet.oldCurrentProjectID = "proj-1";
            planet.loadProjectFromData = jest.fn();

            await planet.closeButton();

            expect(planet.loadProjectFromData).toHaveBeenCalledWith("project-data");
        });
    });
});
