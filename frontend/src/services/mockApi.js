export const sendQuery = async (query) => {
  const cleaned = query.trim().toLowerCase();
  const parts = cleaned.split(" ");
  const command = parts[0];
  const size = parseInt(parts[1]);

  if (command === "alloc" && size > 0) {
    return {
      status: "success",
      memory: {
        total: 256,
        heapUsed: size,
        stackUsed: 0,
        blocks: [{ id: Date.now(), size }],
      },
      message: `Allocated ${size}MB`,
    };
  }

  if (command === "free") {
    return {
      status: "success",
      memory: {
        total: 256,
        heapUsed: 0,
        stackUsed: 0,
        blocks: [],
      },
      message: "Memory cleared",
    };
  }

  return {
    status: "error",
    message: "Invalid command",
  };
};