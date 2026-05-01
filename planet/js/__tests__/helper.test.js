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

// Stub the globals that helper.js references at module level
global.$ = jest.fn(() => ({ modal: jest.fn() }));
global._ = jest.fn(str => str);

// helper.js calls $(document).ready() at load time; ensure $ returns an object
// with .ready so the file can be required without crashing.
global.$ = jest.fn(selector => {
    if (selector === document) return { ready: jest.fn(fn => fn()) };
    return { modal: jest.fn() };
});

// Stub DOM elements consumed by the $(document).ready() block
document.body.innerHTML = `
    <div id="publisher"></div>
    <div id="deleter"></div>
    <div id="projectviewer"></div>
    <input id="global-search" />
    <div id="search-close" style="display:none;"></div>
    <div id="local-tab"></div>
    <div id="global-tab"></div>
    <div id="view-more-chips"></div>
    <div id="morechips" class="flexchips"></div>
    <div id="searchcontainer" style="display:none;"></div>
`;

const {
    debounce,
    getCookie,
    setCookie,
    toggleSearch,
    toggleText,
    toggleExpandable,
    hideOnClickOutside,
    updateCheckboxes
} = require("../helper");

describe("planet/js/helper.js", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    // ─── debounce ───────────────────────────────────────────────────────────────

    describe("debounce()", () => {
        it("should delay function invocation by the wait duration", () => {
            const fn = jest.fn();
            const debounced = debounce(fn, 200);

            debounced();
            expect(fn).not.toHaveBeenCalled();

            jest.advanceTimersByTime(200);
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it("should reset the timer when called again before wait elapses", () => {
            const fn = jest.fn();
            const debounced = debounce(fn, 200);

            debounced();
            jest.advanceTimersByTime(100);
            debounced();
            jest.advanceTimersByTime(100);
            // Only 100ms have passed since the second call, fn should NOT fire yet
            expect(fn).not.toHaveBeenCalled();

            jest.advanceTimersByTime(100);
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it("should fire immediately when immediate=true and not fire on the trailing edge", () => {
            const fn = jest.fn();
            const debounced = debounce(fn, 200, true);

            debounced();
            expect(fn).toHaveBeenCalledTimes(1);

            // Calling again within wait should NOT fire again
            debounced();
            jest.advanceTimersByTime(200);
            expect(fn).toHaveBeenCalledTimes(1);
        });
    });

    // ─── getCookie / setCookie ───────────────────────────────────────────────────

    describe("getCookie()", () => {
        it("should return empty string when the cookie is not set", () => {
            // jsdom starts with an empty cookie jar
            expect(getCookie("missing")).toBe("");
        });

        it("should return the value of an existing cookie", () => {
            // Inject a cookie directly via document.cookie (jsdom supports it)
            document.cookie = "testKey=testValue";
            expect(getCookie("testKey")).toBe("testValue");
        });

        it("should handle cookies with leading spaces", () => {
            document.cookie = "spaced=yes";
            expect(getCookie("spaced")).toBe("yes");
        });
    });

    describe("setCookie()", () => {
        beforeEach(() => {
            // Reset cookie jar by expiring any existing cookies
            document.cookie.split(";").forEach(c => {
                const key = c.split("=")[0].trim();
                document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
            });
        });

        it("should set a cookie that can be read back with getCookie", () => {
            setCookie("myKey", "myValue", 1);
            expect(getCookie("myKey")).toBe("myValue");
        });

        it("should set cookie with SameSite=Strict flag on non-https", () => {
            const cookieSpy = jest.spyOn(document, "cookie", "set");
            setCookie("k", "v", 1);
            const written = cookieSpy.mock.calls[0][0];
            expect(written).toContain("SameSite=Strict");
            expect(written).not.toContain("Secure");
            cookieSpy.mockRestore();
        });
    });

    // ─── toggleSearch ────────────────────────────────────────────────────────────

    describe("toggleSearch()", () => {
        beforeEach(() => {
            document.getElementById("searchcontainer").style.display = "none";
        });

        it("should set display to 'block' when on=true", () => {
            toggleSearch(true);
            expect(document.getElementById("searchcontainer").style.display).toBe("block");
        });

        it("should set display to 'none' when on=false", () => {
            document.getElementById("searchcontainer").style.display = "block";
            toggleSearch(false);
            expect(document.getElementById("searchcontainer").style.display).toBe("none");
        });
    });

    // ─── toggleText ─────────────────────────────────────────────────────────────

    describe("toggleText()", () => {
        beforeEach(() => {
            document.body.innerHTML += '<div id="toggle-target">Show more tags ▼</div>';
        });

        afterEach(() => {
            const el = document.getElementById("toggle-target");
            if (el) el.remove();
        });

        it("should replace 'a' with 'b' when 'a' is present", () => {
            document.getElementById("toggle-target").innerHTML = "Show more tags ▼";
            toggleText("toggle-target", "Show more tags ▼", "Show fewer tags ▲");
            expect(document.getElementById("toggle-target").innerHTML).toBe("Show fewer tags ▲");
        });

        it("should replace 'b' with 'a' when 'a' is absent", () => {
            document.getElementById("toggle-target").innerHTML = "Show fewer tags ▲";
            toggleText("toggle-target", "Show more tags ▼", "Show fewer tags ▲");
            expect(document.getElementById("toggle-target").innerHTML).toBe("Show more tags ▼");
        });
    });

    // ─── toggleExpandable ───────────────────────────────────────────────────────

    describe("toggleExpandable()", () => {
        beforeEach(() => {
            document.body.innerHTML += '<div id="expandable-el" class="flexchips"></div>';
        });

        afterEach(() => {
            const el = document.getElementById("expandable-el");
            if (el) el.remove();
        });

        it("should add ' open' to className when not already open", () => {
            const el = document.getElementById("expandable-el");
            el.className = "flexchips";
            toggleExpandable("expandable-el", "flexchips");
            expect(el.className).toBe("flexchips open");
        });

        it("should remove ' open' from className when already open", () => {
            const el = document.getElementById("expandable-el");
            el.className = "flexchips open";
            toggleExpandable("expandable-el", "flexchips");
            expect(el.className).toBe("flexchips");
        });
    });

    // ─── hideOnClickOutside ─────────────────────────────────────────────────────

    describe("hideOnClickOutside()", () => {
        let popup;

        beforeEach(() => {
            popup = document.createElement("div");
            popup.id = "my-popup";
            popup.style.display = "block";
            document.body.appendChild(popup);
        });

        afterEach(() => {
            popup.remove();
        });

        it("should hide the target element when clicking outside all watched elements", () => {
            hideOnClickOutside([], "my-popup");

            // Simulate a document click with an empty composedPath
            const event = new MouseEvent("click", { bubbles: true });
            Object.defineProperty(event, "composedPath", { value: () => [] });
            document.dispatchEvent(event);

            expect(document.getElementById("my-popup").style.display).toBe("none");
        });

        it("should NOT hide the target when clicking inside a watched element", () => {
            const inner = document.createElement("div");
            document.body.appendChild(inner);

            hideOnClickOutside([inner], "my-popup");

            const event = new MouseEvent("click", { bubbles: true });
            Object.defineProperty(event, "composedPath", { value: () => [inner] });
            document.dispatchEvent(event);

            expect(document.getElementById("my-popup").style.display).toBe("block");
            inner.remove();
        });
    });

    // ─── updateCheckboxes ───────────────────────────────────────────────────────

    describe("updateCheckboxes()", () => {
        beforeEach(() => {
            document.body.innerHTML += `
                <div id="filter-form">
                    <input type="text" data-originalurl="https://example.com/search?" />
                    <input type="checkbox" name="tag1" checked />
                    <input type="checkbox" name="tag2" />
                    <input type="checkbox" name="tag3" checked />
                </div>
            `;
        });

        afterEach(() => {
            const el = document.getElementById("filter-form");
            if (el) el.remove();
        });

        it("should append checked checkbox names as query params to the url input", () => {
            updateCheckboxes("filter-form");
            const urlInput = document
                .getElementById("filter-form")
                .querySelector("input[type=text]");
            expect(urlInput.value).toBe("https://example.com/search?&tag1=True&tag3=True");
        });

        it("should produce only the base url when no checkboxes are checked", () => {
            const form = document.getElementById("filter-form");
            form.querySelectorAll("input[type=checkbox]").forEach(cb => {
                cb.removeAttribute("checked");
                cb.checked = false;
            });
            updateCheckboxes("filter-form");
            const urlInput = form.querySelector("input[type=text]");
            expect(urlInput.value).toBe("https://example.com/search?");
        });
    });
});
