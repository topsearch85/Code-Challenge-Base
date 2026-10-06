import { useEffect, useState } from 'react'
import './App.css'

const PRICE_API = 'https://interview.switcheo.com/prices.json'
const TOKEN_ICON_URL =
  'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens'

function App() {
  const [tokens, setTokens] = useState([])
  const [fromToken, setFromToken] = useState('ETH')
  const [toToken, setToToken] = useState('USDC')
  const [amount, setAmount] = useState('')

  const [loadingPrices, setLoadingPrices] = useState(true)
  const [swapping, setSwapping] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetch(PRICE_API)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch token prices')
        }

        return response.json()
      })
      .then((data) => {
        const availableTokens = data
          .filter((token) => token.price)
          .map((token) => ({
            symbol: token.currency,
            price: Number(token.price),
          }))

        setTokens(availableTokens)
      })
      .catch(() => {
        setError('Unable to load token prices. Please try again.')
      })
      .finally(() => {
        setLoadingPrices(false)
      })
  }, [])

  const from = tokens.find((token) => token.symbol === fromToken)
  const to = tokens.find((token) => token.symbol === toToken)

  const outputAmount =
    from && to && amount
      ? (Number(amount) * from.price) / to.price
      : 0

  const exchangeRate =
    from && to
      ? from.price / to.price
      : 0

  const handleAmountChange = (event) => {
    const value = event.target.value

    setAmount(value)
    setError('')
    setSuccess('')

    if (value && Number(value) <= 0) {
      setError('Amount must be greater than 0.')
    }
  }

  const handleFromTokenChange = (event) => {
    const value = event.target.value

    setFromToken(value)
    setError('')
    setSuccess('')

    if (value === toToken) {
      setError('Please select different tokens.')
    }
  }

  const handleToTokenChange = (event) => {
    const value = event.target.value

    setToToken(value)
    setError('')
    setSuccess('')

    if (value === fromToken) {
      setError('Please select different tokens.')
    }
  }

  const handleSwapDirection = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setError('')
    setSuccess('')
  }

  const handleSubmit = () => {
    setError('')
    setSuccess('')

    if (!amount) {
      setError('Please enter an amount.')
      return
    }

    if (Number(amount) <= 0) {
      setError('Amount must be greater than 0.')
      return
    }

    if (fromToken === toToken) {
      setError('Please select different tokens.')
      return
    }

    setSwapping(true)

    // Simulate a backend request.
    setTimeout(() => {
      setSwapping(false)
      setSuccess('Swap submitted successfully!')
    }, 1200)
  }

  if (loadingPrices && tokens.length === 0) {
    return (
      <main className="app">
        <div className="swap-card loading">
          Loading token prices...
        </div>
      </main>
    )
  }

  return (
    <main className="app">
      <div className="swap-card">
        <div className="header">
          <h1>Swap</h1>
          <p>Exchange your tokens instantly</p>
        </div>

        {error && <div className="message error">{error}</div>}

        {success && (
          <div className="message success">
            {success}
          </div>
        )}

        <div className="token-box">
          <div className="box-header">
            <span>You pay</span>
          </div>

          <div className="token-input">
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
            />

            <select
              value={fromToken}
              onChange={handleFromTokenChange}
            >
              {tokens.map((token) => (
                <option
                  key={token.symbol}
                  value={token.symbol}
                >
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>

          {from && (
            <div className="token-info">
              <img
                src={`${TOKEN_ICON_URL}/${from.symbol}.svg`}
                alt={from.symbol}
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
              />

              <span>{from.symbol}</span>

              <span className="price">
                ${from.price.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="direction-button"
          onClick={handleSwapDirection}
          aria-label="Swap token direction"
        >
          ⇅
        </button>

        <div className="token-box">
          <div className="box-header">
            <span>You receive</span>
          </div>

          <div className="token-input">
            <input
              type="text"
              value={
                outputAmount > 0
                  ? outputAmount.toFixed(6)
                  : ''
              }
              placeholder="0.00"
              readOnly
            />

            <select
              value={toToken}
              onChange={handleToTokenChange}
            >
              {tokens.map((token) => (
                <option
                  key={token.symbol}
                  value={token.symbol}
                >
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>

          {to && (
            <div className="token-info">
              <img
                src={`${TOKEN_ICON_URL}/${to.symbol}.svg`}
                alt={to.symbol}
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
              />

              <span>{to.symbol}</span>

              <span className="price">
                ${to.price.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {from && to && (
          <div className="rate">
            <span>Exchange rate</span>

            <strong>
              1 {from.symbol} ={' '}
              {exchangeRate.toFixed(6)} {to.symbol}
            </strong>
          </div>
        )}

        <button
          type="button"
          className="submit-button"
          onClick={handleSubmit}
          disabled={
            swapping ||
            !amount ||
            Number(amount) <= 0 ||
            fromToken === toToken
          }
        >
          {swapping ? 'Processing...' : 'Swap'}
        </button>
      </div>
    </main>
  )
}

export default App
