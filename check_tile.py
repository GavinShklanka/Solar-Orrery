import urllib.request
r = urllib.request.urlopen('http://localhost:5174/Assets/Textures/NaturalEarthII/0/0/0.jpg')
print(f'Status: {r.status}')
print(f'Content-Type: {r.headers.get("Content-Type")}')
print(f'Length: {r.headers.get("Content-Length")}')
