import ee

PROJECT_ID = "home-credit-505106"

ee.Initialize(project=PROJECT_ID)

image = (
    ee.ImageCollection("COPERNICUS/S1_GRD")
    .first()
)

print(image.bandNames().getInfo())