function canEnterHall(isOpen, hasTicket, hasStaffPass) {
  return isOpen && (hasTicket || hasStaffPass);
}
