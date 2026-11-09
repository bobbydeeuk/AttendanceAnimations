/** Turn Vite's inlined ES module into a classic script for local-file viewers.
 * Inline classic scripts run immediately, so defer explicitly until the data
 * blocks and root element have been parsed. No server or module loader needed.
 */
export function standaloneScripts(html: string): string {
  return html.replace(
    /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi,
    (tag, attributes: string, code: string) => {
      if (!/\btype=["']module["']/i.test(attributes)) return tag;
      if (/\bsrc\s*=/i.test(attributes))
        throw Error("Standalone build still has an external script.");
      return (
        "<script data-attendance-app>\n(function(){function start(){\n" +
        code +
        '\n}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",start,{once:true});}else{start();}})();\n</script>'
      );
    },
  );
}
