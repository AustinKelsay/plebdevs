{
  "kind": 30009,
  "tags": [
    ["d", "junior_dev_2024"],
    ["name", "Junior Developer 2024"],
    ["description", "Awarded upon completion of the Junior Developer course track"],
    ["image", "https://yourplatform.com/badges/junior-dev.png", "1024x1024"],
    ["thumb", "https://yourplatform.com/badges/junior-dev_256x256.png", "256x256"],
    ["thumb", "https://yourplatform.com/badges/junior-dev_64x64.png", "64x64"]
  ]
}

Key points for implementation:

Use a unique identifier in the d tag that includes the course level and year
Include high-res (1024x1024) badge images and multiple thumbnail sizes
Create Badge Award events (kind 8) to assign badges to students who complete courses
Students can then choose to display badges via Profile Badges events (kind 30008)