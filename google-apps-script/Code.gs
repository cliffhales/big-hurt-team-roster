const SPREADSHEET_ID = "1YDxNmTdm-qpF7_O8qN0AKdqN1iLiYqeW5s_IAPZ1N0g";
const SHEET_NAME = "Roster Submissions";
const HEADERS = [
  "Timestamp", "Team Name", "Team Captain", "Team Town", "Non-Racers",
  "Mountain Bike Name", "Mountain Bike Town", "Mountain Bike Email", "Mountain Bike Emergency Name", "Mountain Bike Emergency Phone",
  "Kayak Name", "Kayak Town", "Kayak Email", "Kayak Emergency Name", "Kayak Emergency Phone",
  "Road Bike Name", "Road Bike Town", "Road Bike Email", "Road Bike Emergency Name", "Road Bike Emergency Phone",
  "Run Name", "Run Town", "Run Email", "Run Emergency Name", "Run Emergency Phone",
];
const ROW_KEYS = [
  "teamName", "teamCaptain", "teamTown", "nonRacers",
  "mountainBike-name", "mountainBike-town", "mountainBike-email", "mountainBike-emergencyName", "mountainBike-emergencyPhone",
  "kayak-name", "kayak-town", "kayak-email", "kayak-emergencyName", "kayak-emergencyPhone",
  "roadBike-name", "roadBike-town", "roadBike-email", "roadBike-emergencyName", "roadBike-emergencyPhone",
  "run-name", "run-town", "run-email", "run-emergencyName", "run-emergencyPhone",
];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const expectedSecret = PropertiesService.getScriptProperties().getProperty("SUBMISSION_SECRET");
    if (!expectedSecret || body.secret !== expectedSecret) return respond({ ok: false, error: "Unauthorized." });
    if (!body.row || typeof body.row !== "object") return respond({ ok: false, error: "Missing roster row." });

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) return respond({ ok: false, error: `Sheet tab not found: ${SHEET_NAME}` });
    ensureHeaders(sheet);

    const values = [new Date(), ...ROW_KEYS.map((key) => body.row[key] ?? "")];
    sheet.appendRow(values);
    return respond({ ok: true });
  } catch (error) {
    return respond({ ok: false, error: error.message || "Unexpected spreadsheet error." });
  }
}

function ensureHeaders(sheet) {
  const range = sheet.getRange(1, 1, 1, HEADERS.length);
  const existing = range.getValues()[0];
  if (existing.every((value) => value === "")) {
    range.setValues([HEADERS]);
  } else if (!existing.every((value, index) => value === HEADERS[index])) {
    throw new Error("The first row does not match the expected roster headers.");
  }
}

function respond(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
