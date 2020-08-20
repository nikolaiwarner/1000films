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

async function getFilm({ number }) {
  const data = readData()
  const film = data.films[number - 1]
  if (film) {
    console.log(
      `#${number}: "${film.title}" - ${film.year} - ${film.director} - ${film.length} minutes`,
    )
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

      console.log('Available at:')
      offers.forEach((offer) => {
        let price = ''
        if (offer.retail_price) {
          price = ` - $${offer.retail_price}`
        }
        console.log(`- ${offer.provider.clear_name} - ${offer.presentation_type}${price}`)
      })
    }
    return searchResult
  }
}

const help = `
1000films - where to watch the 1000 greatest films as ranked by theyshootpictures.com, 2020 version

How to use:
$1000films [number]
`

const args = process.argv.slice(2)
if (args[0]) {
  getFilm({ number: args[0] })
} else {
  console.log(help)
}
