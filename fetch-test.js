fetch('http://localhost:3000/api/users/check-username?username=orell19z')
  .then(res => res.text())
  .then(text => console.log(text))
  .catch(err => console.error(err));
