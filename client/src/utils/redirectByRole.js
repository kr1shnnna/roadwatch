export const getDashboardPath = (role) => {
  switch (role) {
    case "citizen":
      return "/citizen";

    case "officer":
      return "/officer";

    default:
      return "/unauthorized";
  }
};