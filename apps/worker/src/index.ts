async function runWorker(): Promise<void> {
  console.log("AI worker started");
}

runWorker().catch((error: unknown) => {
  console.error("Worker failed", error);
  process.exitCode = 1;
});
