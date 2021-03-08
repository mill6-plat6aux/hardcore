/*!
 * Hardcore.js
 * Copyright 2017-2021 Takuro Okada.
 * Released under the MIT License.
 */

const assert = require('assert');
const rewire = require('rewire');

require("jsdom-global")();

const hardcore = rewire("../src/hardcore.js");

before(() => {
    Object.defineProperty(window.navigator, "language", {
        get() { return "ja-JP"; }
    });
});

describe("DateUtil", () => {
    let DateUtil = hardcore.__get__("DateUtil");
    it("format", () => {
        assert.strictEqual(DateUtil.format(new Date(2020, 4-1, 5)), "2020-04-05");
        assert.strictEqual(DateUtil.format(new Date(2020, 4-1, 5), "yyyyMMdd"), "20200405");
        assert.strictEqual(DateUtil.format(new Date(2020, 4-1, 5), "yyyy/M/d"), "2020/4/5");
        assert.strictEqual(DateUtil.format(new Date(2020, 4-1, 5), "yyyy/M/d EEEE"), "2020/4/5 Sunday");
        assert.strictEqual(DateUtil.format(new Date(2020, 4-1, 5), "yyyy/M/d EEE"), "2020/4/5 Sun");
        assert.strictEqual(DateUtil.format(new Date(2020, 4-1, 5), "yyyy/M/d eeee"), "2020/4/5 日曜日");
        assert.strictEqual(DateUtil.format(new Date(2020, 4-1, 5), "yyyy/M/d eee"), "2020/4/5 日");
        assert.strictEqual(DateUtil.format(new Date(2020, 4-1, 5, 14, 2), "yyyy/M/d H:mm"), "2020/4/5 14:02");
        assert.strictEqual(DateUtil.format(new Date(2020, 4-1, 5, 4, 25, 3), "yyyy/M/d HH:mm:ss"), "2020/4/5 04:25:03");
        assert.strictEqual(DateUtil.format(null), null);
        assert.strictEqual(DateUtil.format(""), null);
        assert.strictEqual(DateUtil.format(new Date(), "TEST"), "TEST");
    });
    it("getDateByAdding", () => {
        let DateUnit = hardcore.__get__("DateUnit");
        assert.strictEqual(DateUtil.getDateByAdding(new Date(2020, 4-1, 5), 3).getTime(), new Date(2020, 4-1, 8).getTime());
        assert.strictEqual(DateUtil.getDateByAdding(new Date(2020, 4-1, 5), -3).getTime(), new Date(2020, 4-1, 2).getTime());
        assert.strictEqual(DateUtil.getDateByAdding(new Date(2020, 4-1, 5), 3, DateUnit.date).getTime(), new Date(2020, 4-1, 8).getTime());
        assert.strictEqual(DateUtil.getDateByAdding(new Date(2020, 4-1, 5, 9, 30, 45), 20, DateUnit.second).getTime(), new Date(2020, 4-1, 5, 9, 31, 5).getTime());
        assert.strictEqual(DateUtil.getDateByAdding(new Date(2020, 4-1, 5, 9, 30, 45), 30, DateUnit.minute).getTime(), new Date(2020, 4-1, 5, 10, 0, 45).getTime());
        assert.strictEqual(DateUtil.getDateByAdding(new Date(2020, 4-1, 5, 9, 30, 45), 30, DateUnit.hour).getTime(), new Date(2020, 4-1, 6, 15, 30, 45).getTime());
        assert.strictEqual(DateUtil.getDateByAdding(new Date(2020, 4-1, 5), 5, DateUnit.month).getTime(), new Date(2020, 9-1, 5).getTime());
        assert.strictEqual(DateUtil.getDateByAdding(new Date(2020, 4-1, 5), 5, DateUnit.year).getTime(), new Date(2025, 4-1, 5).getTime());
        assert.strictEqual(DateUtil.getDateByAdding(), null);
        assert.strictEqual(DateUtil.getDateByAdding("TEST"), null);
        assert.strictEqual(DateUtil.getDateByAdding(new Date()), null);
        assert.strictEqual(DateUtil.getDateByAdding(new Date(), "TEST"), null);
    });
    it("getDateBySlicingTime", () => {
        assert.strictEqual(DateUtil.getDateBySlicingTime(new Date(2020, 4-1, 5, 9, 30, 45)).getTime(), new Date(2020, 4-1, 5, 0, 0, 0).getTime());
        assert.strictEqual(DateUtil.getDateBySlicingTime(), null);
        assert.strictEqual(DateUtil.getDateBySlicingTime("TEST"), null);
    });
});

describe("StringUtil", () => {
    let StringUtil = hardcore.__get__("StringUtil");
    it("getNullable", () => {
        assert.strictEqual(StringUtil.getNullable(null), "");
        assert.strictEqual(StringUtil.getNullable(undefined), "");
        assert.strictEqual(StringUtil.getNullable(null, "TEST"), "TEST");
        assert.strictEqual(StringUtil.getNullable(123, "TEST"), "123");
        assert.strictEqual(StringUtil.getNullable(""), "");
        assert.strictEqual(StringUtil.getNullable("TEST"), "TEST");
    });
    it("padding", () => {
        assert.strictEqual(StringUtil.padding(5, "0", 3), "005");
        assert.strictEqual(StringUtil.padding(5, 0, 3), "005");
        assert.strictEqual(StringUtil.padding("5", 0, 3), "005");
        assert.strictEqual(StringUtil.padding("5", "0", 3), "005");
        assert.strictEqual(StringUtil.padding("53", "0", 2), "53");
        assert.strictEqual(StringUtil.padding("53", "0", 1), "53");
        assert.strictEqual(StringUtil.padding("53", "0", 0), "53");
        assert.strictEqual(StringUtil.padding(null), null);
        assert.strictEqual(StringUtil.padding(""), "");
        assert.strictEqual(StringUtil.padding("", ""), "");
    });
    it("currencyString", () => {
        assert.strictEqual(StringUtil.currencyString(1), "1");
        assert.strictEqual(StringUtil.currencyString(12), "12");
        assert.strictEqual(StringUtil.currencyString(123), "123");
        assert.strictEqual(StringUtil.currencyString(1234), "1,234");
        assert.strictEqual(StringUtil.currencyString(12345), "12,345");
        assert.strictEqual(StringUtil.currencyString(123456), "123,456");
        assert.strictEqual(StringUtil.currencyString(1234567), "1,234,567");
        assert.strictEqual(StringUtil.currencyString("1234567"), "1,234,567");
        assert.strictEqual(StringUtil.currencyString(""), "");
        assert.strictEqual(StringUtil.currencyString(null), "");
        assert.strictEqual(StringUtil.currencyString("ABC"), "");
        assert.strictEqual(StringUtil.currencyString(Number.NaN), "");
    });
});

describe("Rect", () => {
    let Rect = hardcore.__get__("Rect");
    let Point = hardcore.__get__("Point");
    it("contains", () => {
        assert.strictEqual(Rect(10, 10, 100, 100).contains(Point(50, 50)), true);
        assert.strictEqual(Rect(10, 10, 100, 100).contains(Point(11, 11)), true);
        assert.strictEqual(Rect(10, 10, 100, 100).contains(Point(11, 109)), true);
        assert.strictEqual(Rect(10, 10, 100, 100).contains(Point(109, 109)), true);
        assert.strictEqual(Rect(10, 10, 100, 100).contains(Point(109, 11)), true);
        assert.strictEqual(Rect(10, 10, 100, 100).contains(Point(10, 10)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).contains(Point(10, 11)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).contains(Point(11, 10)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).contains(Point(110, 10)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).contains(Point(110, 9)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).contains(Point(109, 10)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).contains(Point(110, 110)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).contains(Point(110, 109)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).contains(Point(109, 110)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).contains(Point(10, 110)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).contains(Point(9, 110)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).contains(Point(10, 109)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).contains(Point(200, 200)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).contains(""), false);
        assert.strictEqual(Rect(10, 10, 100, 100).contains(null), false);
    });
    it("intersect", () => {
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(50, 50, 100, 100)), true);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(50, -40, 100, 100)), true);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(-40, 50, 100, 100)), true);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(-40, -40, 100, 100)), true);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(10, 10, 100, 100)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(10, 10, 99, 99)), true);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(10, 10, 10, 10)), true);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(-40, 40, 100, 10)), true);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(40, -40, 10, 100)), true);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(40, 40, 100, 10)), true);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(40, 40, 10, 100)), true);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(110, 10, 100, 100)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(100, 110, 100, 100)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(-90, 10, 100, 100)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(10, -90, 100, 100)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(110, 110, 100, 100)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(-90, -90, 100, 100)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(110, -90, 100, 100)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(-90, 110, 100, 100)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(111, 10, 100, 100)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(10, 111, 100, 100)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(-91, 10, 100, 100)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(Rect(10, -91, 100, 100)), false);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(""), false);
        assert.strictEqual(Rect(10, 10, 100, 100).intersect(null), false);
    });
    it("midX", () => {
        assert.strictEqual(Rect(10, 15, 100, 100).midX(), 60);
    });
    it("midY", () => {
        assert.strictEqual(Rect(10, 15, 100, 100).midY(), 65);
    });
    it("maxX", () => {
        assert.strictEqual(Rect(10, 15, 100, 100).maxX(), 110);
    });
    it("maxY", () => {
        assert.strictEqual(Rect(10, 15, 100, 100).maxY(), 115);
    });
});

describe("Polygon", () => {
    let Polygon = hardcore.__get__("Polygon");
    let Point = hardcore.__get__("Point");
    it("contains", () => {
        assert.strictEqual(Polygon(
            Point(10, 100),
            Point(60, 10),
            Point(110, 100),
        ).contains(Point(50, 50)), true);
        assert.strictEqual(Polygon(
            Point(10, 100),
            Point(60, 10),
            Point(110, 100),
        ).contains(Point(11, 99)), true);
        assert.strictEqual(Polygon(
            Point(10, 100),
            Point(60, 10),
            Point(110, 100),
        ).contains(Point(60, 11)), true);
        assert.strictEqual(Polygon(
            Point(10, 100),
            Point(60, 10),
            Point(110, 100),
        ).contains(Point(109, 99)), true);
        assert.strictEqual(Polygon(
            Point(10, 100),
            Point(60, 10),
            Point(110, 100),
        ).contains(Point(10, 100)), false);
        assert.strictEqual(Polygon(
            Point(10, 100),
            Point(60, 10),
            Point(110, 100),
        ).contains(Point(60, 10)), false);
        assert.strictEqual(Polygon(
            Point(10, 100),
            Point(60, 10),
            Point(110, 100),
        ).contains(Point(110, 100)), false);
        assert.strictEqual(Polygon(
            Point(10, 100),
            Point(60, 10),
            Point(110, 100),
        ).contains(""), false);
        assert.strictEqual(Polygon(
            Point(10, 100),
            Point(60, 10),
            Point(110, 100),
        ).contains(null), false);
    });
});

describe("Color", () => {
    let Color = hardcore.__get__("Color");
    it("constructor", () => {
        let color = new Color("#e74c3c");
        assert.strictEqual(color.red, 231);
        assert.strictEqual(color.green, 76);
        assert.strictEqual(color.blue, 60);
        color = new Color("gray");
        assert.strictEqual(color.red, 128);
        assert.strictEqual(color.green, 128);
        assert.strictEqual(color.blue, 128);
        color = new Color();
        assert.strictEqual(color.red, 0);
        assert.strictEqual(color.green, 0);
        assert.strictEqual(color.blue, 0);
    });
    it("toString", () => {
        let color = new Color(231, 76, 60);
        assert.strictEqual(color.toString(), "#e74c3c");
    });
    it("toStringWithAlpha", () => {
        let color = new Color(231, 76, 60, 0.5);
        assert.strictEqual(color.toStringWithAlpha(), "rgba(231,76,60,0.5)");
    });
});
