exports.sentimentAnalysisSchema = {
    "statements": {
        "type": "array",
        "required": true,
        "minLength": 1,
        "items": {
            "type": "string",
            "minLength": 1,
            "required": true
        }
    }
}