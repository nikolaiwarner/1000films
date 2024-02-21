#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

function readData() {
  try {
    const rawdata = fs.readFileSync(
      path.join(__dirname, './theyshootpictures-2020.json'),
      'utf8',
    )
    return JSON.parse(rawdata)
  } catch (e) {
    console.log(e)
  }
}

function renderFilmString(number, film) {
  console.log(
    `#${number}: "${film.title}" - ${film.year} - ${film.director} - ${film.length} minutes`,
  )
}

function listAll() {
  const data = readData()
  data.films.forEach((film, index) => {
    renderFilmString(index + 1, film)
  })
}

async function findFilm({ query }) {
  query = query.toString().toLowerCase()
  console.log(`Searching for: "${query}"`)
  console.log('')

  const data = readData()
  data.films.forEach((film, index) => {
    if (
      film.title.toLowerCase().includes(query) ||
      film.year.toString().includes(query) ||
      film.director.toLowerCase().includes(query) ||
      film.country.toLowerCase().includes(query)
    ) {
      renderFilmString(index + 1, film)
    }
  })
}

async function getFilm({ number }) {
  const data = readData()
  const film = data.films[number - 1]
  if (film) {
    renderFilmString(number, film)
    console.log('')
    console.log('Check availability:')
    const query = encodeURIComponent(film.title)
    console.log(`https://www.justwatch.com/us/search?q=${query}`)
  }
}

const help = `
1000films: where to watch the 1000 greatest films as ranked by theyshootpictures.com, 2020 version

Show film info and where to watch by rank:
$ 1000films [number]

Search for films:
$ 1000films [search string]

List all films:
$ 1000films -l
`

const args = process.argv.slice(2)
const query = args[0]
if (query) {
  if (query === '-l') {
    listAll()
  } else {
    const number = parseInt(query)
    if (number && number <= 1000) {
      getFilm({ number })
    } else {
      findFilm({ query })
    }
  }
} else {
  console.log(help)
}
