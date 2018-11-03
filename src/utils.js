export default function getNotifyUserInfo(githubUser, users) {
  for (const user of users) {
    if (githubUser === user.github) {
      return user;
    }
  }
  return {};
}
