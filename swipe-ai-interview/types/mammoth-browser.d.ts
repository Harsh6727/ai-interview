declare module "mammoth/mammoth.browser.js" {
  const mammoth: {
    extractRawText: (opts: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
  };
  export = mammoth;
}
