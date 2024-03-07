export default function isValidJsonString(jsonString) {
  if (!(jsonString && typeof jsonString === 'string')) {
    return false;
  }

  try {
    JSON.parse(jsonString);
    return true;
  } catch (error) {
    return false;
  }
}
