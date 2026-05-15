/**
 * Script: Tự động tìm ảnh từ Pexels, upload lên Cloudinary, cập nhật DB
 *
 * Cách chạy:
 *   node seed-images.mjs YOUR_PEXELS_API_KEY
 *
 * Yêu cầu: Node.js 18+, backend đang chạy tại http://localhost:5000
 */

const PEXELS_KEY = process.argv[2]
if (!PEXELS_KEY) {
  console.error('Usage: node seed-images.mjs <PEXELS_API_KEY>')
  console.error('Get free key at: https://www.pexels.com/api/')
  process.exit(1)
}

const API_URL = 'http://localhost:5000/api'

// Cloudinary credentials (from appsettings.json)
const CLOUD_NAME = 'dg9vbz2yr'
const CLOUD_API_KEY = '672764728621666'
const CLOUD_API_SECRET = 'R6ePNcNyu4XbuZkZ4QPXdGDqUk8'

// Map dishId -> search keyword trên Pexels
const dishSearchMap = {
  // Khai Vi
  1: 'kimchi korean side dish',
  2: 'cucumber pickles asian',
  3: 'fresh salad bowl',
  4: 'garlic butter bread toast',
  5: 'french fries crispy',
  6: 'fried corn kernels',
  7: 'sweet potato fries',
  8: 'cheese fries',

  // Thit Nuong
  9: 'grilled pork belly sesame',
  10: 'grilled beef spicy sauce',
  11: 'beef wrapped lettuce korean',
  12: 'grilled pork ribs bbq',
  13: 'grilled cartilage pork',
  14: 'grilled pork belly straw',
  15: 'beef wrapped mushroom',
  16: 'grilled mushrooms plate',
  17: 'grilled pork strips bbq',
  18: 'grilled beef steak chunk',
  19: 'beef short ribs grilled',
  20: 'beef chuck roll sliced',
  21: 'american beef belly sliced',
  22: 'grilled buffalo meat',
  23: 'beef enoki mushroom roll',
  24: 'beef brisket grilled',
  25: 'wagyu beef premium grilled',
  26: 'wagyu striploin premium',

  // Hai San Nuong
  27: 'grilled shrimp prawns',
  28: 'grilled squid tentacles',
  29: 'grilled octopus chili',
  30: 'grilled whole squid eggs',
  31: 'grilled oysters scallion oil',
  32: 'grilled razor clams',

  // Lai Rai
  33: 'meat skewers grilled',
  34: 'grilled sausages bbq',
  35: 'grilled tripe stomach',
  36: 'grilled oxtail',
  37: 'grilled pork intestine',
  38: 'boneless chicken feet',
  39: 'grilled intestine platter',

  // Lau Set
  40: 'thai tom yum hotpot',
  41: 'thai hotpot seafood',
  42: 'hotpot set vegetables meat',
  43: 'large hotpot party',
  44: 'hotpot feast table',

  // Lau - Thit Goi Them
  45: 'raw sliced pork hotpot',
  46: 'raw beef slices hotpot',
  47: 'raw beef plate asian',

  // Lau - Hai San Goi Them
  48: 'fresh clams plate',
  49: 'crab sticks surimi',
  50: 'raw squid plate',
  51: 'fresh raw shrimp plate',
  52: 'raw octopus plate',
  53: 'raw squid eggs plate',

  // Vien Tha Lau & Rau
  54: 'sausage hotpot',
  55: 'cheese sausage',
  56: 'dumplings asian',
  57: 'lobster balls hotpot',
  58: 'cheese tofu cubes',
  59: 'mixed meatballs plate',
  60: 'fresh vegetables hotpot plate',
  61: 'tofu skin enoki mushroom',

  // Do Uong
  62: 'mineral water bottle',
  63: 'coca cola can',
  64: 'fresh cola drink ice',
  65: 'lemon tea iced',
  66: 'pandan tea iced',
  67: 'fresh lemonade glass',
  68: 'passion fruit juice',
  69: 'fresh orange juice',
  70: 'watermelon juice glass',
  71: 'peach tea lemongrass',
  72: 'yogurt smoothie ice',

  // Ruou Bia
  73: 'coconut wine bottle',
  74: 'rice wine vietnamese',
  75: 'fruit wine bottle',
  76: 'plum wine bottle',
  77: 'mulberry wine',
  78: 'soju bottle korean',
  79: 'vietnamese beer can',
  80: 'tiger beer bottle',
  81: 'heineken beer bottle',
}

// --- Pexels API ---
async function searchPexels(query) {
  const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=square`, {
    headers: { Authorization: PEXELS_KEY }
  })
  if (!res.ok) {
    console.error(`  Pexels error: ${res.status} ${res.statusText}`)
    return null
  }
  const data = await res.json()
  if (data.photos && data.photos.length > 0) {
    // medium size ~350x350
    return data.photos[0].src.medium
  }
  return null
}

// --- Cloudinary Upload from URL ---
async function uploadToCloudinary(imageUrl, dishId) {
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = 'nhat-nuong-menu'
  const publicId = `dish_${dishId}`

  // Generate signature
  const signStr = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${CLOUD_API_SECRET}`
  const encoder = new TextEncoder()
  const data = encoder.encode(signStr)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

  const formData = new FormData()
  formData.append('file', imageUrl)
  formData.append('api_key', CLOUD_API_KEY)
  formData.append('timestamp', timestamp.toString())
  formData.append('signature', signature)
  formData.append('folder', folder)
  formData.append('public_id', publicId)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`  Cloudinary error: ${text}`)
    return null
  }

  const result = await res.json()
  return result.secure_url
}

// --- Login to get JWT ---
async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@gmail.com', password: '123456' })
  })
  if (!res.ok) throw new Error(`Login failed: ${res.status}`)
  const data = await res.json()
  return data.data.accessToken
}

// --- Update dish image via API ---
async function updateDishImage(token, dishId, imageUrl) {
  // First get current dish data
  const getRes = await fetch(`${API_URL}/dishes/${dishId}`)
  if (!getRes.ok) return false
  const dishData = await getRes.json()
  const dish = dishData.data

  const res = await fetch(`${API_URL}/dishes/${dishId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: dish.name,
      price: dish.price,
      description: dish.description,
      image: imageUrl,
      status: dish.status,
      categoryId: dish.categoryId,
    })
  })
  return res.ok
}

// --- Main ---
async function main() {
  console.log('=== Seed Images for Nhat Nuong ===\n')

  // Login
  console.log('Logging in...')
  const token = await login()
  console.log('Login OK\n')

  const dishIds = Object.keys(dishSearchMap).map(Number)
  let success = 0
  let failed = 0

  for (const dishId of dishIds) {
    const query = dishSearchMap[dishId]
    process.stdout.write(`[${dishId}/81] "${query}" ... `)

    try {
      // 1. Search Pexels
      const pexelsUrl = await searchPexels(query)
      if (!pexelsUrl) {
        console.log('SKIP (no image found)')
        failed++
        continue
      }

      // 2. Upload to Cloudinary
      const cloudUrl = await uploadToCloudinary(pexelsUrl, dishId)
      if (!cloudUrl) {
        console.log('SKIP (upload failed)')
        failed++
        continue
      }

      // 3. Update dish in DB via API
      const updated = await updateDishImage(token, dishId, cloudUrl)
      if (updated) {
        console.log(`OK -> ${cloudUrl}`)
        success++
      } else {
        console.log('SKIP (update failed)')
        failed++
      }

      // Rate limit: Pexels allows 200 req/hour
      await new Promise(r => setTimeout(r, 500))
    } catch (err) {
      console.log(`ERROR: ${err.message}`)
      failed++
    }
  }

  console.log(`\n=== Done: ${success} success, ${failed} failed ===`)
}

main().catch(console.error)
