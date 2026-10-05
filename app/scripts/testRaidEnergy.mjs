import {
  MAX_ENERGY,
  DAMAGE_ENERGY_PER_HP,
  getFastMoveEnergy,
  getChargedMoveCost,
  addEnergy,
  canUseChargedMove,
  spendEnergy,
  applyFastMoveEnergy,
  applyChargedMoveEnergy,
  calculateDamageEnergy,
  applyDamageEnergy,
} from '../src/engine/raid/energy.js'

let passed = 0
let failed = 0

function expectEqual(
  name,
  actual,
  expected
) {
  if (actual === expected) {
    passed += 1
    console.log(`✅ ${name}`)
  } else {
    failed += 1

    console.log(`❌ ${name}`)
    console.log(
      `   Expected: ${expected}`
    )
    console.log(
      `   Actual:   ${actual}`
    )
  }
}

function expectThrows(
  name,
  callback
) {
  try {
    callback()

    failed += 1
    console.log(`❌ ${name}`)
    console.log(
      '   Expected function to throw.'
    )
  } catch {
    passed += 1
    console.log(`✅ ${name}`)
  }
}

console.log(
  'Testing PokeIQ Raid Energy Engine...'
)

console.log('')
console.log(
  '================================'
)
console.log(
  'ENERGY CONSTANTS'
)
console.log(
  '================================'
)

expectEqual(
  'Maximum energy',
  MAX_ENERGY,
  100
)

expectEqual(
  'Damage energy per HP',
  DAMAGE_ENERGY_PER_HP,
  0.5
)

console.log('')
console.log(
  '================================'
)
console.log(
  'MOVE ENERGY'
)
console.log(
  '================================'
)

expectEqual(
  'Dragon Tail generates 8 energy',
  getFastMoveEnergy(8),
  8
)

expectEqual(
  'Outrage costs 50 energy',
  getChargedMoveCost(-50),
  50
)

expectEqual(
  'One-bar move costs 100 energy',
  getChargedMoveCost(-100),
  100
)

console.log('')
console.log(
  '================================'
)
console.log(
  'ENERGY STORAGE'
)
console.log(
  '================================'
)

expectEqual(
  'Add energy normally',
  addEnergy(40, 8),
  48
)

expectEqual(
  'Energy caps at 100',
  addEnergy(96, 8),
  100
)

expectEqual(
  'Energy cannot overflow',
  addEnergy(100, 8),
  100
)

console.log('')
console.log(
  '================================'
)
console.log(
  'CHARGED MOVE AVAILABILITY'
)
console.log(
  '================================'
)

expectEqual(
  'Charged Move unavailable below cost',
  canUseChargedMove(49, 50),
  false
)

expectEqual(
  'Charged Move available at exact cost',
  canUseChargedMove(50, 50),
  true
)

expectEqual(
  'Charged Move available above cost',
  canUseChargedMove(73, 50),
  true
)

console.log('')
console.log(
  '================================'
)
console.log(
  'ENERGY APPLICATION'
)
console.log(
  '================================'
)

expectEqual(
  'Dragon Tail: 0 → 8',
  applyFastMoveEnergy(0, 8),
  8
)

expectEqual(
  'Dragon Tail: 48 → 56',
  applyFastMoveEnergy(48, 8),
  56
)

expectEqual(
  'Dragon Tail respects cap',
  applyFastMoveEnergy(96, 8),
  100
)

expectEqual(
  'Outrage: 56 → 6',
  applyChargedMoveEnergy(
    56,
    -50
  ),
  6
)

expectEqual(
  'Exact Charged Move cost: 50 → 0',
  applyChargedMoveEnergy(
    50,
    -50
  ),
  0
)

console.log('')
console.log(
  '================================'
)
console.log(
  'DAMAGE ENERGY'
)
console.log(
  '================================'
)

expectEqual(
  '10 HP lost generates 5 energy',
  calculateDamageEnergy(10),
  5
)

expectEqual(
  '11 HP lost generates 5.5 energy',
  calculateDamageEnergy(11),
  5.5
)

expectEqual(
  'Damage energy is applied',
  applyDamageEnergy(20, 10),
  25
)

expectEqual(
  'Damage energy respects cap',
  applyDamageEnergy(98, 10),
  100
)

console.log('')
console.log(
  '================================'
)
console.log(
  'VALIDATION'
)
console.log(
  '================================'
)

expectThrows(
  'Cannot spend unavailable energy',
  () =>
    spendEnergy(
      49,
      50
    )
)

expectThrows(
  'Energy cannot exceed 100',
  () =>
    addEnergy(
      101,
      1
    )
)

expectThrows(
  'Energy cannot be negative',
  () =>
    addEnergy(
      -1,
      1
    )
)

expectThrows(
  'HP lost cannot be negative',
  () =>
    calculateDamageEnergy(
      -1
    )
)

console.log('')
console.log(
  '================================'
)
console.log(
  'TEST RESULTS'
)
console.log(
  '================================'
)

console.log(
  `Passed: ${passed}`
)

console.log(
  `Failed: ${failed}`
)

console.log(
  `Total: ${passed + failed}`
)

console.log('')

if (failed === 0) {
  console.log(
    `🎉 ${passed}/${passed} tests passed.`
  )

  console.log(
    'Raid energy validation successful.'
  )
} else {
  console.log(
    `❌ ${failed} test(s) failed.`
  )

  process.exitCode = 1
}