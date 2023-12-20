export default (date: Date) => {
  const startDate = new Date(
    Date.UTC(
      date.getFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
  const endDate = new Date(
    date.getFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );

  return { startDate, endDate };
};
