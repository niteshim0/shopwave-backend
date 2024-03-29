const getChartData = ({
  length,
  docArr,
  today,
  property,
}) => {
  const data = new Array(length).fill(0)

  docArr.forEach((i) => {
    const creationDate = i.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12

    if (monthDiff < length) {
      if (property) {
        data[length - monthDiff - 1] += i[property]
      } else {
        data[length - monthDiff - 1] += 1
      }
    }
  })

  return data
}

export {getChartData}