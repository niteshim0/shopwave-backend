const calculatePercentage = (thisMonth, lastMonth) => {
  const percent = lastMonth === 0 ? thisMonth * 100 : (thisMonth / lastMonth) * 100;
  return Number(percent.toFixed(0));
};

export { calculatePercentage };
