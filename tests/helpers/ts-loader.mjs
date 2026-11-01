import fs from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const target = path.resolve(process.cwd(), `${specifier.slice(2)}.ts`);
      if (fs.existsSync(target)) {
        return { url: pathToFileURL(target).href, shortCircuit: true };
      }
    }
    try {
      return nextResolve(specifier, context);
    } catch (err) {
      if (
        (specifier.startsWith("./") || specifier.startsWith("../")) &&
        context.parentURL
      ) {
        const baseDir = path.dirname(fileURLToPath(context.parentURL));
        const tsCandidate = path.resolve(baseDir, `${specifier}.ts`);
        if (fs.existsSync(tsCandidate)) {
          return { url: pathToFileURL(tsCandidate).href, shortCircuit: true };
        }
      }
      throw err;
    }
  },
  load(url, context, nextLoad) {
    if (url.endsWith(".ts") || url.endsWith(".tsx")) {
      const filePath = fileURLToPath(url);
      const source = fs.readFileSync(filePath, "utf8");
      const { outputText } = ts.transpileModule(source, {
        fileName: filePath,
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      });
      return {
        format: "module",
        source: outputText,
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  },
});
