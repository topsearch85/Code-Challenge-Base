# Problem 3: Messy React

## 1. Technology and React Concepts

This code block uses:

### a. ReactJS with TypeScript

The component is written using React with TypeScript.

TypeScript provides static typing for:

* `WalletBalance`
* `FormattedWalletBalance`
* Component `Props`
* Function parameters and return values

The original code has some TypeScript issues, such as using `any` for `blockchain` and accessing `balance.blockchain` even though it is not defined in the `WalletBalance` interface.

### b. Functional Components

The code uses a React functional component:

```tsx
const WalletPage = (props: Props) => {
  // ...
};
```

It does not use a class component.

### c. React Hooks

The component uses React Hooks, including:

* `useMemo()` for memoizing the balance filtering/sorting calculation.
* `useWalletBalances()` for retrieving wallet balances.
* `usePrices()` for retrieving token prices.

The custom hooks `useWalletBalances()` and `usePrices()` are assumed to be defined elsewhere.

---

## 2. Issues and How to Improve Them

The original implementation has a combination of **correctness issues, TypeScript issues, React anti-patterns, and unnecessary computations**.

### Issue 1: Undefined variable `lhsPriority`

Original code:

```tsx
const balancePriority = getPriority(balance.blockchain);

if (lhsPriority > -99) {
```

`lhsPriority` does not exist in this scope. The variable that was just calculated is `balancePriority`.

This causes a runtime error.

### Improvement

Use:

```tsx
if (balancePriority > -99) {
```

---

### Issue 2: `blockchain` is missing from `WalletBalance`

The interface declares:

```tsx
interface WalletBalance {
  currency: string;
  amount: number;
}
```

But the code accesses:

```tsx
balance.blockchain
```

This is inconsistent with the TypeScript definition.

### Improvement

Add `blockchain` to the interface:

```tsx
interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string;
}
```

---

### Issue 3: Using `any`

The priority function uses:

```tsx
const getPriority = (blockchain: any): number => {
```

Using `any` disables TypeScript's type checking and makes the code less safe.

### Improvement

Use a proper type:

```tsx
const getPriority = (blockchain: string): number => {
```

An even stronger solution would be to define a union type containing the supported blockchain names.

---

### Issue 4: Incorrect `useMemo` dependency

The code uses:

```tsx
const sortedBalances = useMemo(() => {
  // ...
}, [balances, prices]);
```

However, `prices` is not used anywhere inside the `useMemo` calculation.

Therefore, whenever prices change, React unnecessarily recalculates the filtering and sorting of balances.

### Improvement

Only include values used by the calculation:

```tsx
}, [balances]);
```

The `prices` value is only required when calculating the USD value for each rendered row.

---

### Issue 5: `getPriority` is declared inside the component

The function:

```tsx
const getPriority = (blockchain: any): number => {
  // ...
};
```

is recreated every time `WalletPage` renders.

This is not necessarily a major performance problem because the function is small, but it is unnecessary because it does not depend on component state or props.

### Improvement

Move it outside the component:

```tsx
const getPriority = (blockchain: string): number => {
  // ...
};
```

This also makes the function easier to test and reuse.

There is no need to use `useCallback()` for this function because it does not need to be passed as a prop or dependency.

---

### Issue 6: Priority is calculated repeatedly

The priority is calculated during filtering:

```tsx
const balancePriority = getPriority(balance.blockchain);
```

and then calculated again during sorting:

```tsx
const leftPriority = getPriority(lhs.blockchain);
const rightPriority = getPriority(rhs.blockchain);
```

A sort comparator can execute many times, so repeatedly calculating the same priority is unnecessary.

### Improvement

Use a lookup object:

```tsx
const PRIORITIES: Record<string, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};
```

Then:

```tsx
const getPriority = (blockchain: string): number => {
  return PRIORITIES[blockchain] ?? -99;
};
```

For very large datasets, the priority can also be calculated once and carried through the filtering/sorting operation.

---

### Issue 7: `formattedBalances` is created but never used

The code creates:

```tsx
const formattedBalances = sortedBalances.map((balance) => {
  return {
    ...balance,
    formatted: balance.amount.toFixed()
  };
});
```

But then renders:

```tsx
const rows = sortedBalances.map(...)
```

instead of:

```tsx
formattedBalances.map(...)
```

Therefore, the `formattedBalances` calculation is wasted.

It also means `formatted` is not actually available on the object being passed to `WalletRow`.

### Improvement

Either render `formattedBalances` or combine the formatting step with the filtering and sorting calculation.

Combining them is cleaner because it avoids creating an unnecessary intermediate array.

---

### Issue 8: Incorrect TypeScript type for `rows`

The code says:

```tsx
const rows = sortedBalances.map(
  (balance: FormattedWalletBalance, index: number) => {
```

But `sortedBalances` contains `WalletBalance` objects, not `FormattedWalletBalance` objects.

Simply annotating the callback parameter does not convert the objects into another type.

### Improvement

Actually transform the objects into `FormattedWalletBalance`:

```tsx
.map((balance) => ({
  ...balance,
  formatted: balance.amount.toFixed(),
}))
```

Then map over that result.

---

### Issue 9: Array index used as React `key`

The original code uses:

```tsx
key={index}
```

Using an array index as a key can cause incorrect component reuse when items are reordered, inserted, or removed.

This is particularly relevant here because the balances are sorted.

For example, after sorting, the item at index `0` may represent a different currency than it did previously.

### Improvement

Use a stable identifier:

```tsx
key={`${balance.blockchain}-${balance.currency}`}
```

If the actual data has a unique ID, that would be preferable.

---

### Issue 10: Possible incorrect filtering condition

The original code uses:

```tsx
if (balance.amount <= 0) {
  return true;
}
```

This includes zero and negative balances.

For a wallet balance display, the likely intention is to show balances greater than zero:

```tsx
balance.amount > 0
```

However, this is a business-rule decision and should be confirmed rather than blindly changed.

### Improvement

If only positive balances should be displayed:

```tsx
return priority > -99 && balance.amount > 0;
```

---

### Issue 11: `React.FC` is unnecessary

The original component is:

```tsx
const WalletPage: React.FC<Props> = (props: Props) => {
```

The `React.FC<Props>` and `props: Props` combination is redundant.

### Improvement

Use:

```tsx
const WalletPage = (props: Props) => {
```

or destructure the props directly:

```tsx
const WalletPage = ({ ...rest }: Props) => {
```

This is simpler and avoids unnecessary typing.

---

### Issue 12: `children` is extracted but never used

The code contains:

```tsx
const { children, ...rest } = props;
```

but `children` is never rendered.

This is dead code and makes the component harder to understand.

### Improvement

Remove `children` unless the component is supposed to render it.

---

### Issue 13: Unnecessary intermediate `rows` array

The code first creates:

```tsx
const rows = sortedBalances.map(...)
```

and then renders:

```tsx
{rows}
```

Creating the `rows` array isn't inherently bad, but there is no reason to keep it separate unless it improves readability or the rows need to be reused.

### Improvement

Render directly:

```tsx
{formattedBalances.map((balance) => (
  <WalletRow ... />
))}
```

This reduces unnecessary intermediate variables.

---

### Issue 14: Multiple array transformations

The original implementation effectively performs:

```text
balances
  → filter()
  → sort()
  → map() for formatting
  → map() for React rows
```

The `filter`, `sort`, and formatting operations can be combined into one memoized transformation.

The final JSX mapping is then only responsible for rendering.

### Improvement

Use one `useMemo()` for the expensive data transformation:

```tsx
const formattedBalances = useMemo(() => {
  return balances
    .filter(...)
    .sort(...)
    .map(...);
}, [balances]);
```

This makes the data-processing responsibility clearer.

---

## 3. Refactored Version

```tsx
interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string;
}

type FormattedWalletBalance = WalletBalance & {
  formatted: string;
};

interface Props extends BoxProps {}

const PRIORITIES: Record<string, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};

const getPriority = (blockchain: string): number => {
  return PRIORITIES[blockchain] ?? -99;
};

const WalletPage = ({ ...rest }: Props) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  const formattedBalances = useMemo<FormattedWalletBalance[]>(() => {
    return balances
      .filter((balance) => {
        const priority = getPriority(balance.blockchain);

        return priority > -99 && balance.amount > 0;
      })
      .sort(
        (lhs, rhs) =>
          getPriority(rhs.blockchain) -
          getPriority(lhs.blockchain)
      )
      .map((balance) => ({
        ...balance,
        formatted: balance.amount.toFixed(),
      }));
  }, [balances]);

  return (
    <div {...rest}>
      {formattedBalances.map((balance) => {
        const usdValue =
          (prices[balance.currency] ?? 0) * balance.amount;

        return (
          <WalletRow
            className={classes.row}
            key={`${balance.blockchain}-${balance.currency}`}
            amount={balance.amount}
            usdValue={usdValue}
            formattedAmount={balance.formatted}
          />
        );
      })}
    </div>
  );
};
```

---

## 4. Why This Refactoring Is Better

The refactored implementation:

* Keeps the component as a functional component.
* Continues using React Hooks.
* Keeps `useMemo` only around the expensive balance transformation.
* Removes the unnecessary `prices` dependency from `useMemo`.
* Removes `any`.
* Correctly types `blockchain`.
* Fixes the undefined `lhsPriority` variable.
* Actually uses the formatted balance data.
* Uses a stable React key instead of the array index.
* Moves the static priority function outside the component.
* Removes unnecessary `React.FC`.
* Removes unused `children`.
* Keeps price calculation separate because prices are needed only for rendering the USD value.
* Makes the data transformation easier to understand and maintain.

## 5. Important Performance Consideration

It would be an anti-pattern to blindly add `useMemo()` and `useCallback()` everywhere.

For example, this is **not automatically better**:

```tsx
const rows = useMemo(() => {
  return formattedBalances.map(...);
}, [formattedBalances]);
```

Mapping an ordinary array into a small number of React elements is generally cheap.

The more important optimization is memoizing the **filtering and sorting**, because sorting can be considerably more computationally expensive than creating the JSX elements.

Therefore, the refactoring focuses `useMemo()` on the calculation that actually benefits from memoization.

