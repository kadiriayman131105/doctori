export function printDocument() {
  document.body.classList.add('doctori-printing');
  const done = () => {
    document.body.classList.remove('doctori-printing');
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  window.print();
}
