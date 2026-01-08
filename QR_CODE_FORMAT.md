# QR Code Format Guide

## ⚠️ CRITICAL: What Goes in the QR Code

The QR code must contain **ONLY the ticket UUID** from the database.

### ✅ Correct Format

```
abc12345-6789-0abc-def0-123456789abc
```

**Example from database:**
```
Ticket ID (UUID): 550e8400-e29b-41d4-a716-446655440000
QR Code Content:  550e8400-e29b-41d4-a716-446655440000
```

### ❌ Wrong Formats (Don't Use These)

```
❌ https://yoursite.com/ticket/550e8400-e29b-41d4...  (No URLs!)
❌ {"id": "550e8400-e29b-41d4..."}                    (No JSON!)
❌ 123456                                              (This is the 6-digit code, not for QR!)
❌ YATRA-550e8400-e29b-41d4...                        (No prefixes!)
```

---

## 📋 Physical Ticket Layout

Each printed ticket should have:

```
┌─────────────────────────────────────┐
│         YATRA 2024                  │
│    College Cultural Event           │
├─────────────────────────────────────┤
│                                     │
│  Name: Alice Kumar                  │
│  Type: COMBO PASS                   │
│                                     │
│  ┌─────────────────┐               │
│  │                 │               │
│  │   [QR CODE]     │               │
│  │   (UUID only)   │               │
│  │                 │               │
│  └─────────────────┘               │
│                                     │
│  Manual Code: 123456               │
│  (Use if QR fails)                 │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔧 How to Generate QR Codes

### Method 1: Online (Small Batches)

1. Export tickets from Supabase:
   - Go to **Table Editor** → **tickets**
   - Click **"..."** → **"Export to CSV"**

2. For each ticket:
   - Copy the `id` (UUID column)
   - Go to: https://www.qr-code-generator.com/
   - Paste the UUID (just the UUID, nothing else)
   - Download the QR code PNG

### Method 2: Python Script (Recommended for Bulk)

```python
# generate_qr_codes.py
import qrcode
import csv

# Read tickets from CSV
with open('tickets.csv', 'r') as file:
    reader = csv.DictReader(file)
    
    for row in reader:
        ticket_id = row['id']  # UUID
        code = row['code_6_digit']
        name = row['name']
        
        # Generate QR code with ONLY the UUID
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(ticket_id)  # Just the UUID!
        qr.make(fit=True)
        
        # Save QR code image
        img = qr.make_image(fill_color="black", back_color="white")
        img.save(f'qr_codes/ticket_{code}_{name.replace(" ", "_")}.png')
        
print("QR codes generated!")
```

**To use this:**
```bash
pip install qrcode[pil]
python generate_qr_codes.py
```

### Method 3: Node.js Script (Alternative)

```javascript
// generate-qr-codes.js
const QRCode = require('qrcode');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_ANON_KEY'
);

async function generateQRCodes() {
  // Fetch all tickets
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync('qr_codes')) {
    fs.mkdirSync('qr_codes');
  }
  
  // Generate QR code for each ticket
  for (const ticket of tickets) {
    const filename = `qr_codes/ticket_${ticket.code_6_digit}.png`;
    
    // Generate QR with ONLY the UUID
    await QRCode.toFile(filename, ticket.id, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
      margin: 1
    });
    
    console.log(`Generated: ${filename}`);
  }
}

generateQRCodes();
```

**To use this:**
```bash
npm install qrcode @supabase/supabase-js
node generate-qr-codes.js
```

---

## 🖨️ Printing Tips

### For Professional Printing:
1. Generate QR codes at **300 DPI** minimum
2. Size: 2-3 inches (5-7 cm) square
3. High contrast (black on white is best)
4. Leave white border around QR code
5. Test scan before mass printing!

### For Quick Testing:
1. Generate small batch (10-20 tickets)
2. Print on regular paper
3. Test with scanner app before event
4. Make sure phone camera can read from 6-12 inches away

---

## 🧪 Testing Your QR Codes

### Test Before Printing All Tickets!

1. Generate QR code with test UUID
2. Open your scanner app
3. Point camera at QR code on screen/paper
4. Should see GREEN screen with "Entry Allowed"
5. Scan same QR again → should see RED "Already Used"

### Test QR Code Readers
- Your YATRA scanner app (primary)
- Any generic QR reader (should show just the UUID)
- Multiple phones (test camera quality)

---

## 📊 Sample Data Export

When you export tickets from Supabase, you'll get CSV like:

```csv
id,code_6_digit,email,name,ticket_type,day1_used,day2_used
550e8400-e29b-41d4-a716-446655440000,123456,alice@test.com,Alice Kumar,DAY1,false,false
6fa459ea-ee8a-3ca4-894e-db77e160355e,234567,bob@test.com,Bob Sharma,COMBO,false,false
```

**For QR codes, use the `id` column (first column)**
**For manual fallback, use the `code_6_digit` column**

---

## 💡 Pro Tips

1. **Always include manual code on ticket**
   - QR can get damaged/smudged
   - 6-digit code is the backup

2. **Print extra tickets**
   - 5-10% extra for lost tickets
   - Keep digital backup of all QR codes

3. **Test with worst-case phones**
   - Low-end Android phones
   - Old iPhones
   - Different lighting conditions

4. **Laminate VIP/Multi-day passes**
   - COMBO tickets get scanned twice
   - Protection prevents wear and tear

5. **QR Code placement**
   - Front and center of ticket
   - Not near folds or edges
   - Away from other text/graphics

---

## 🆘 Troubleshooting

**QR code won't scan:**
- Check it contains ONLY the UUID (no URLs, no JSON)
- Increase QR code size (make it bigger)
- Increase error correction level (use 'H')
- Better lighting when scanning

**Wrong ticket verified:**
- You might have put wrong UUID in QR
- Re-export data from Supabase
- Regenerate QR codes

**"Invalid ticket" on valid QR:**
- UUID doesn't exist in database
- Typo when generating QR
- Test by scanning with generic QR reader first

---

Need help? See **SUPABASE_SETUP_GUIDE.md** for full setup instructions.
