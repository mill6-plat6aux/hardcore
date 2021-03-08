/*!
 * Hardcore.js
 * Copyright 2017-2021 Takuro Okada.
 * Released under the MIT License.
 */

const FileSystem = require("fs");
const UglifyJS = require("uglify-es");
const Polyfill = require("polyfill-library");

let distDirectory = "dist";
let distFileName = "hardcore";
let es6Suffix = ".es6";
let minifySuffix = ".min";

let minify = true;
let clean = false;
let es6 = false;
let sourceFileNames = [];
process.argv.slice(2).forEach(function(argument) {
    if(argument.startsWith("-")) {
        if(argument.startsWith("--minify")) {
            if(argument.length > "--minify=".length) {
                let value = argument.substr("--minify=".length);
                minify = value == "true";
            }
        }else if(argument.startsWith("--crean")) {
            clean = true;
        }else if(argument.startsWith("--es6")) {
            es6 = true;
        }
    }else {
        sourceFileNames.push(argument);
    }
});

if(clean) {
    if(FileSystem.existsSync(distDirectory)) {
        FileSystem.rmdirSync(distDirectory, {recursive: true});
    }
}
if(!FileSystem.existsSync(distDirectory)) {
    FileSystem.mkdirSync(distDirectory);
}
let distFilePath = distDirectory+"/"+distFileName;
if(es6) distFilePath += es6Suffix;
if(minify) distFilePath += minifySuffix;
distFilePath += ".js";
let distributionFile = FileSystem.createWriteStream(distFilePath, "utf8");

function includeSource(fileName, minify, minifyOptions) {
    let sourceFile;
    try {
        sourceFile = FileSystem.readFileSync("src/"+fileName+".js", "utf8");
    }catch(error) {
        console.error(error);
        return;
    }
    if(minify) {
        let minifiedFile = UglifyJS.minify(sourceFile, minifyOptions);
        if(minifiedFile.error != null) {
            console.error(minifiedFile.error);
            return;
        }
        distributionFile.write(minifiedFile.code);
    }else {
        distributionFile.write(sourceFile);
        distributionFile.write("\n");
    }
}

includeSource("hardcore", minify, {output: { comments: /^!/ }});
sourceFileNames.forEach(sourceFileName => {
    includeSource(sourceFileName, minify);
});
if(es6) {
    if(FileSystem.existsSync("export.json")) {
        let exportExpression = "export{ "
        let exportSettings = JSON.parse(FileSystem.readFileSync("export.json", "utf8"));
        exportExpression += exportSettings["hardcore"].join(",");
        let additionalExpression = sourceFileNames.map(sourceFileName => {
            return exportSettings[sourceFileName].join(",");
        }).join(",");
        if(additionalExpression.length > 0) {
            exportExpression += ","+additionalExpression;
        }
        exportExpression += "};";
        distributionFile.write(exportExpression);
        distributionFile.write("\n");
    }
}

let polyfillSettings;
if(FileSystem.existsSync("polyfill.json")) {
    polyfillSettings = JSON.parse(FileSystem.readFileSync("polyfill.json", "utf8"));
}

if(polyfillSettings != null && Array.isArray(polyfillSettings)) {
    Polyfill.getPolyfillString({
        minify: false, 
        features: Object.assign(...polyfillSettings.map(entry => ({ [entry]: {flags:["gated"]} })))
    }).then((polyfillSource) => {
        if(minify) {
            let minifiedFile = UglifyJS.minify(polyfillSource);
            if(minifiedFile.error != null) {
                console.error(minifiedFile.error);
            }else {
                distributionFile.write(minifiedFile.code);
            }
        }else {
            distributionFile.write("\n");
            distributionFile.write("////////////////////////////////////// Polyfill //////////////////////////////////////\n");
            distributionFile.write("\n");
            distributionFile.write(polyfillSource);
            distributionFile.write("\n");
        }
        distributionFile.end();
        process.exit(0);
    });
}else {
    process.exit(0);
}
