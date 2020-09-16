#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const JustWatch = require('justwatch-api')

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
    const justwatch = new JustWatch()
    const providers = await justwatch.getProviders()
    const searchResult = await justwatch.search({
      content_types: ['movie'],
      query: film.title,
      release_year_from: film.year,
      release_year_until: film.year,
      // providers: ['hbm'],
    })

    if (searchResult && searchResult.items[0] && searchResult.items[0].offers) {
      let offers = searchResult.items[0].offers

      offers = offers.map((offer) => {
        offer.provider = providers.find((provider) => provider.id === offer.provider_id)
        return offer
      })

      // Sort by price
      offers = offers.sort((a, b) => {
        const priceA = a.retail_price || 0
        const priceB = b.retail_price || 0
        return priceA > priceB ? 1 : -1
      })

      let finalOffers = []
      if (verbose) {
        finalOffers = offers
      } else {
        // Remove duplicates
        let uniqueOffers = []
        offers = offers.forEach((offer) => {
          const include = !uniqueOffers.some((unique) => {
            return offer.provider_id === unique.provider_id
          })
          if (include) {
            uniqueOffers.push(offer)
          }
        })

        // Limit results
        finalOffers = uniqueOffers.slice(0, 4)
      }

      console.log('Available at:')
      finalOffers.forEach((offer) => {
        if (offer.provider) {
          let price = ''
          if (offer.retail_price) {
            price = ` - $${offer.retail_price}`
          }
          let format = ''
          if (verbose) {
            format = ` - ${offer.presentation_type}`
          }
          console.log(`- ${offer.provider.clear_name}${format}${price}`)
        }
      })
    }
    return searchResult
  }
}

const help = `
1000films: where to watch the 1000 greatest films as ranked by theyshootpictures.com, 2020 version

Show film info and where to watch by rank:
$ 1000films [number]

Show more verbose results:
$ 1000films [number] -v

Search for films:
$ 1000films [search string]

List all films:
$ 1000films -l
`

const args = process.argv.slice(2)
const query = args[0]
const verbose = args.includes('-v')
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
