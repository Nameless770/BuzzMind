function render(view, buildLocals = () => ({})) {
  return (req, res) => {
    res.render(view, buildLocals(req, res));
  };
}


function redirect(target) {
  return (req, res) => {
    res.redirect(target);
  };
}

module.exports = { render, redirect };



