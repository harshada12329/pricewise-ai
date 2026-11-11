
import { useState } from 'react'
import './App.css'

// Sample grocery products
const products = [
  { id: 1, name: 'Whole Milk', size: '1 Gallon', category: 'Dairy', walmart: 3.48, kroger: 3.79, emoji: '🥛' },
  { id: 2, name: 'Large Eggs', size: '12 Count', category: 'Dairy', walmart: 4.25, kroger: 3.99, emoji: '🥚' },
  { id: 3, name: 'White Bread', size: '20 oz', category: 'Bakery', walmart: 2.48, kroger: 2.69, emoji: '🍞' },
  { id: 4, name: 'Basmati Rice', size: '5 lb', category: 'Grains', walmart: 8.99, kroger: 9.49, emoji: '🍚' },
  { id: 5, name: 'Bananas', size: '1 lb', category: 'Produce', walmart: 0.58, kroger: 0.69, emoji: '🍌' },
  { id: 6, name: 'Butter', size: '1 lb', category: 'Dairy', walmart: 4.48, kroger: 4.29, emoji: '🧈' },
]

function App() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [shoppingList, setShoppingList] = useState([])
  const [question, setQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  
  const [selectedStores, setSelectedStores] = useState([
    'Walmart',
    'Kroger'
  ])
  
  const walmartTotal = shoppingList.reduce(
    (total, item) => total + item.walmart * item.quantity,
    0
  )

  const krogerTotal = shoppingList.reduce(
    (total, item) => total + item.kroger * item.quantity,
    0
  )
  
  const walmartItems = shoppingList.filter(
    (item) => item.walmart <= item.kroger
  )

  const krogerItems = shoppingList.filter(
    (item) => item.kroger < item.walmart
  )

  const walmartSubtotal = walmartItems.reduce(
    (total, item) => total + item.walmart * item.quantity,
    0
  )

  const krogerSubtotal = krogerItems.reduce(
    (total, item) => total + item.kroger * item.quantity,
    0
  )
  
  // 1. Calculate totals for selected stores
  const selectedStoreTotals = selectedStores.map((store) => {
    const storeKey = store.toLowerCase()

    const availableItems = shoppingList.filter(
      (item) => typeof item[storeKey] === 'number'
    )

    const total = availableItems.reduce(
      (sum, item) => sum + item[storeKey] * item.quantity,
      0
    )

    return {
      store,
      total,
      availableCount: availableItems.length,
      missingCount: shoppingList.length - availableItems.length
    }
  })

  const completeStoreTotals = selectedStoreTotals.filter(
    (store) =>
      shoppingList.length > 0 &&
      store.missingCount === 0
  )

  const recommendedStore =
    shoppingList.length === 0
      ? 'Add items to your list'
      : selectedStores.length === 0
      ? 'Select a store'
      : completeStoreTotals.length === 0
      ? 'No single selected store has all items'
      : completeStoreTotals.reduce((best, current) =>
          current.total < best.total ? current : best
        ).store

  const recommendedStoreTotal =
    completeStoreTotals.length > 0
      ? Math.min(...completeStoreTotals.map(store => store.total))
      : null

  
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase())

    const matchesCategory =
      selectedCategory === 'All' ||
      product.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const getSelectedStorePrices = (product) => {
    return selectedStores
      .map(store => ({
        store,
        price: product[store.toLowerCase()]
      }))
      .filter(item => item.price !== undefined && item.price !== null)
  }
  

  // 2. Find the cheapest selected store for each item
  const optimizedItems = shoppingList.map((item) => {
    const prices = getSelectedStorePrices(item)

    if (prices.length === 0) {
      return {
        ...item,
        bestStore: null,
        bestPrice: null
      }
    }

    const best = prices.reduce((lowest, current) =>
      current.price < lowest.price ? current : lowest
    )

    return {
      ...item,
      bestStore: best.store,
      bestPrice: best.price
    }
  })

  const optimizedTotal = optimizedItems.reduce(
    (total, item) =>
      total + (item.bestPrice ?? 0) * item.quantity,
    0
  )
  // Keep basketSavings after optimizedTotal
  const basketSavings =
    recommendedStoreTotal === null
      ? null
      : Math.max(0, recommendedStoreTotal - optimizedTotal)

  const itemsWithoutSelectedPrices = optimizedItems.filter(
    (item) => item.bestPrice === null
  ).length


  function addToList(product) {
    setShoppingList((currentList) => {
      const alreadyAdded = currentList.some(
        (item) => item.id === product.id
      )

      if (alreadyAdded) {
        return currentList.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [...currentList, { ...product, quantity: 1 }]
    })
  }

  function updateQuantity(productId, change) {
    setShoppingList((currentList) =>
      currentList
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + change }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function removeFromList(productId) {
    setShoppingList((currentList) =>
      currentList.filter((item) => item.id !== productId)
    )
  }

  function askAssistant() {
    const userQuestion = question.trim().toLowerCase()

    if (!userQuestion) {
      setAiAnswer('Please enter a question first.')
      return
    }

    if (shoppingList.length === 0) {
      setAiAnswer('Your shopping list is empty. Add some groceries first!')
      return
    }

    
    if (
      userQuestion.includes('shopping list') ||
      userQuestion.includes('separate list') ||
      userQuestion.includes('split')
    ) {
      setAiAnswer('Your store-wise shopping lists are displayed below.')
    } else if (userQuestion.includes('walmart')) {
      setAiAnswer(
        `Your basket costs $${walmartTotal.toFixed(2)} at Walmart.`
      )
    } else if (userQuestion.includes('kroger')) {
      setAiAnswer(
        `Your basket costs $${krogerTotal.toFixed(2)} at Kroger.`
      )
    } else if (
      userQuestion.includes('each item') ||
      userQuestion.includes('each product') ||
      userQuestion.includes('split') ||
      userQuestion.includes('which store should i buy')
    ) {
      const recommendations = optimizedItems.map((item) => {
        const bestStore =
          item.walmart <= item.kroger ? 'Walmart' : 'Kroger'

        const bestPrice = Math.min(item.walmart, item.kroger)

        return `${item.name} (${item.quantity}): ${bestStore} - $${(bestPrice * item.quantity).toFixed(2)}`
      })

      setAiAnswer(recommendations.join(' | '))
    } else if (
      userQuestion.includes('save') ||
      userQuestion.includes('cheapest') ||
      userQuestion.includes('best price')
    ) {
      const cheaperStore =
        walmartTotal <= krogerTotal ? 'Walmart' : 'Kroger'

      const cheaperStoreTotal = Math.min(walmartTotal, krogerTotal)
      const savings = cheaperStoreTotal - optimizedTotal

      setAiAnswer(
        `Your cheapest single-store option is ${cheaperStore} at $${cheaperStoreTotal.toFixed(2)}. If you buy each product from its cheapest store, your total is $${optimizedTotal.toFixed(2)}. You could save $${savings.toFixed(2)} by splitting your shopping between stores.`
      )
    } else {
      setAiAnswer(
        `Your basket costs $${walmartTotal.toFixed(2)} at Walmart and $${krogerTotal.toFixed(2)} at Kroger. The optimized total is $${optimizedTotal.toFixed(2)}.`
      )
    }
  }

  return (
    <main className="app">
      <header className="navbar">
        <h2>🛒 PriceWise <span>AI</span></h2>
        <p>Smart grocery shopping starts here</p>
      </header>

      <section className="hero">
        <p className="eyebrow">YOUR SMART SHOPPING ASSISTANT</p>
        <h1>Save more on every grocery trip.</h1>
        <p>Compare prices across stores and find the best deals.</p>

        <input
          type="text"
          placeholder="Search milk, eggs, rice..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </section>

      <section className="products">

        <div className="store-selection">
          <h3>Select Stores to Compare</h3>

          {['Walmart', 'Kroger', 'Target', 'Aldi'].map((store) => (
            <label key={store} className="store-option">
              <input
                type="checkbox"
                checked={selectedStores.includes(store)}
                onChange={() => {
                  setSelectedStores((currentStores) =>
                    currentStores.includes(store)
                      ? currentStores.filter((item) => item !== store)
                      : [...currentStores, store]
                  )
                }}
              />
              {store}
            </label>
          ))}
        </div>

        <div className="section-heading">
          <h2>Compare Grocery Prices</h2>
          <span>{filteredProducts.length} products</span>
        </div>

        <div className="category-filters">
          {['All', ...new Set(products.map((product) => product.category))].map(
            (category) => (
              <button
                key={category}
                className={
                  selectedCategory === category ? 'active' : ''
                }
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            )
          )}
        </div>

        <div className="product-grid">
          {filteredProducts.map((product) => {
            
            return (
              <article className="product-card" key={product.id}>
                <div className="product-emoji">{product.emoji}</div>
                <h3>{product.name}</h3>
                <p className="product-size">{product.size}</p>

                {getSelectedStorePrices(product).map((item) => (
                  <div className="price-row" key={item.store}>
                    <span>{item.store}</span>
                    <strong>${item.price.toFixed(2)}</strong>
                  </div>
                ))}

                {getSelectedStorePrices(product).length > 0 ? (
                  <div className="best-price">
                    Best price: {
                      getSelectedStorePrices(product).reduce((best, item) =>
                        item.price < best.price ? item : best
                      ).store
                    } – $
                    {Math.min(
                      ...getSelectedStorePrices(product).map(item => item.price)
                    ).toFixed(2)}
                  </div>
                ) : (
                  <div className="best-price">
                    Select a store to see prices.
                  </div>
                )}

                <button onClick={() => addToList(product)}>
                  + Add to shopping list
                </button>
              </article>
            )
          })}
        </div>

        {filteredProducts.length === 0 && (
          <p>No matching products found.</p>
        )}
      </section>

      <section className="shopping-list">
        <h2>My Shopping List ({shoppingList.length})</h2>

        {shoppingList.length > 0 && (
          <div className="basket-totals">
            {selectedStoreTotals.map((store) => (
              <div key={store.store}>
                <h3>{store.store}</h3>

                {store.availableCount > 0 ? (
                  <>
                    <p>${store.total.toFixed(2)}</p>

                    {store.missingCount > 0 && (
                      <small>
                        {store.missingCount} products without prices
                      </small>
                    )}
                  </>
                ) : (
                  <p>No prices available</p>
                )}
              </div>
            ))}
          </div>
        )}

        
        {shoppingList.length === 0 ? (
          <p>Your shopping list is empty. Add some groceries!</p>
        ) : (
          shoppingList.map((item, index) => (
            <div className="list-item" key={item.id}>
            <div>
              <strong>{item.emoji} {item.name}</strong>
              <p>Quantity: {item.quantity}</p>
            </div>

            <div className="item-controls">
              <button onClick={() => updateQuantity(item.id, -1)}>
                −
              </button>

              <strong>{item.quantity}</strong>

              <button onClick={() => updateQuantity(item.id, 1)}>
                +
              </button>
            </div>

            <div className="item-best-price">
              <span>
                {item.walmart <= item.kroger ? 'Walmart' : 'Kroger'}
              </span>
              <strong>
                ${(Math.min(item.walmart, item.kroger) * item.quantity).toFixed(2)}
              </strong>
            </div>
            <button
              className="remove-button"
              onClick={() => removeFromList(item.id)}
            >
              Remove
            </button>
          </div>
          ))
        )}

        <div className="recommendation">
          <h3>🏆 Recommended Store</h3>
          <p>{recommendedStore}</p>

          {basketSavings !== null && basketSavings > 0 && (
            <span>
              Save ${basketSavings.toFixed(2)} by shopping across stores!
            </span>
          )}
        </div>
        
        <div>
          <h3>Smart Basket Total</h3>
          <p>${optimizedTotal.toFixed(2)}</p>
          {itemsWithoutSelectedPrices > 0 && (
            <p>
              {itemsWithoutSelectedPrices} item(s) don't have prices
              at selected stores. Total is partial.
            </p>
          )}
        </div>

      </section>
      
      <section className="ai-assistant">
        <div className="ai-heading">
          <span>🤖</span>
          <div>
            <h2>PriceWise AI Assistant</h2>
            <p>Ask me anything about your grocery savings!</p>
          </div>
        </div>

        <div className="ai-input-area">
          <input
            type="text"
            placeholder="Where can I save the most?"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                askAssistant()
              }
            }}
          />

          <button onClick={askAssistant}>
            Ask AI
          </button>
        </div>

        
      
      {aiAnswer && (
        <div className="ai-answer">
          <strong>🤖 PriceWise says:</strong>
          <p>{aiAnswer}</p>
        </div>
      )}

      {shoppingList.length > 0 && (
        <div className="store-lists">
          {walmartItems.length > 0 && (
            <div className="store-card">
              <h3>🛒 Walmart Shopping List</h3>

              {walmartItems.map((item) => (
                <div className="store-item" key={item.id}>
                  {item.emoji} {item.name} × {item.quantity}
                </div>
              ))}

              <h4>Subtotal: ${walmartSubtotal.toFixed(2)}</h4>
            </div>
          )}

          {krogerItems.length > 0 && (
            <div className="store-card">
              <h3>🛒 Kroger Shopping List</h3>

              {krogerItems.map((item) => (
                <div className="store-item" key={item.id}>
                  {item.emoji} {item.name} × {item.quantity}
                </div>
              ))}

              <h4>Subtotal: ${krogerSubtotal.toFixed(2)}</h4>
            </div>
          )}

          <div className="optimized-total">
            <h3>Smart Basket Total: ${optimizedTotal.toFixed(2)}</h3>
          </div>
        </div>
      )}

      </section>

      <footer>
        <p>PriceWise AI · Smart shopping, smarter savings.</p>
        <small>Demo prices for learning purposes only.</small>
      </footer>
    </main>
  )
}

export default App
