import re
with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("item.addEventListener('click', (e) => {", "item.addEventListener('click', async (e) => {")
content = content.replace("globalSearchInput.addEventListener('input', (e) => {", "globalSearchInput.addEventListener('input', async (e) => {")
content = content.replace("timelineScaleSelect.addEventListener('change', (e) => {", "timelineScaleSelect.addEventListener('change', async (e) => {")
content = content.replace("instrumentSelect.addEventListener('change', (e) => {", "instrumentSelect.addEventListener('change', async (e) => {")
content = content.replace("btnNewBooking.addEventListener('click', () => {", "btnNewBooking.addEventListener('click', async () => {")
content = content.replace("document.addEventListener('click', (e) => {", "document.addEventListener('click', async (e) => {")
content = content.replace("formEditInstrument.addEventListener('submit', (e) => {", "formEditInstrument.addEventListener('submit', async (e) => {")
content = content.replace("formEditUser.addEventListener('submit', (e) => {", "formEditUser.addEventListener('submit', async (e) => {")
content = content.replace("btnPrevDay.addEventListener('click', () => {", "btnPrevDay.addEventListener('click', async () => {")
content = content.replace("btnNextDay.addEventListener('click', () => {", "btnNextDay.addEventListener('click', async () => {")
content = content.replace("btnToday.addEventListener('click', () => {", "btnToday.addEventListener('click', async () => {")
content = content.replace("btnEditInstrument.addEventListener('click', () => {", "btnEditInstrument.addEventListener('click', async () => {")

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)
