const categoryAgeRanges = {
  Children: { min: 0, max: 12 },
  Teenagers: { min: 13, max: 17 },
  Adults: { min: 18, max: 120 },
};

function isAgeEligible(category, age) {
  const range = categoryAgeRanges[category];
  return Boolean(range) && age >= range.min && age <= range.max;
}

module.exports = { categoryAgeRanges, isAgeEligible };