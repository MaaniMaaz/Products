function getUserDetail(user) {
  return {
    _id: user._id,
    profileImage: user.athleticDetails.profileImage || null,
    email: user.email,
    name: user.name,
  };
}

module.exports = { getUserDetail };
