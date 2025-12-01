const createDefaultGoals = (userId) => {
  const currentTimestamp = Date.now();

  return [
    {
      userId,
      type: "longTerm",
      goal: "Untitled Goal",
      startDate: currentTimestamp,
      deadline: currentTimestamp,
    },
    {
      userId,
      type: "shortTerm",
      goal: "Untitled Goal",
      startDate: currentTimestamp,
      deadline: currentTimestamp,
    },
  ];
};

module.exports = { createDefaultGoals };
