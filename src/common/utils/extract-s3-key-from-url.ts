export function extractS3KeyFromCloudFrontUrl(url: string) {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.slice(1);
  } catch (error) {
    console.error("Invalid URL:", error);
    return null;
  }
}
