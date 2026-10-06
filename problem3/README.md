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

## 2. Computational Inefficiencies and Anti-Patterns

### 2.1 Incorrect `useMemo` dependency

Original:

```tsx
const sortedBalances = useMemo(() => {
  // ...
}, [balances, prices]);
```

`prices` is not used inside this calculation.

Therefore, changing prices causes the filtering and sorting operation to run again unnecessarily.

It should be:

```tsx
}, [balances]);
```

---

### 2.2 `getPriority()` is recreated on every render

The function is declared inside the component:

```tsx
const getPriority = (blockchain: any): number => {
  // ...
};
```

A new function is created every time `WalletPage` renders.

Because this function does not depend on component state or props, it can be moved outside the component.

This also makes the function easier to test and reuse.

---

### 2.3 Unnecessary use of `any`

The original code contains:

```tsx
(blockchain: any)
```

This removes TypeScript's type safety.

Since the blockchain is a string, at minimum it should be:

```tsx
(blockchain: string)
```

Alternatively, the supported blockchain values can be represented using a union type.

---

### 2.4 Priority is calculated repeatedly

The code calculates the priority during filtering:

```tsx
const balancePriority = getPriority(balance.blockchain);
```

and then calculates it again during sorting:

```tsx
const leftPriority = getPriority(lhs.blockchain);
const rightPriority = getPriority(rhs.blockchain);
```

The sorting comparator may execute many times, so repeatedly calculating the same value is unnecessary.

A priority lookup object can make this simpler and more efficient.

---

### 2.5 `formattedBalances` is calculated but never used

The code creates:

```tsx
const formattedBalances = sortedBalances.map((balance) => {
  return {
    ...balance,
    formatted: balance.amount.toFixed()
  };
});
```

However, the next section maps over `sortedBalances` instead:

```tsx
const rows = sortedBalances.map(...)
```

Therefore, `formattedBalances` is unused.

This is also a correctness issue because `WalletRow` expects `formatted`, but `sortedBalances` does not contain that property.

---

### 2.6 `FormattedWalletBalance` does not match `sortedBalances`

The code declares:

```tsx
const rows = sortedBalances.map(
  (balance: FormattedWalletBalance, index: number) => {
```

But `sortedBalances` contains `WalletBalance`, not `FormattedWalletBalance`.

Adding a TypeScript annotation to the callback parameter does not change the actual type of the array.

The correct approach is to map the data into `FormattedWalletBalance` first and then render it.

---

### 2.7 `balance.blockchain` is missing from the interface

The interface declares:

```tsx
interface WalletBalance {
  currency: string;
  amount: number;
}
```

But the component uses:

```tsx
balance.blockchain
```

The interface should include:

```tsx
blockchain: string;
```

---

### 2.8 Array index used as React key

The original code uses:

```tsx
key={index}
```

This is not recommended for lists where items can be reordered, added, or removed.

The balances are sorted, so an item's index can change.

A stable key should be used instead, for example:

```tsx
key={`${balance.blockchain}-${balance.currency}`}
```

An actual unique ID would be preferable if one exists.

---

### 2.9 Possible incorrect balance condition

The original code contains:

```tsx
if (balance.amount <= 0) {
  return true;
}
```

This means balances with zero or negative amounts are included.

For a wallet balance list, it is more likely that the intended condition is:

```tsx
balance.amount > 0
```

This should ultimately be confirmed against the application's business requirements.

---

### 2.10 Unnecessary `React.FC`

The original code uses:

```tsx
const WalletPage: React.FC<Props> = (props: Props) => {
```

The `React.FC` and explicit `props: Props` are redundant.

A simpler approach is:

```tsx
const WalletPage = ({ ...rest }: Props) => {
```

---

### 2.11 Unused `children`

The component extracts:

```tsx
const { children, ...rest } = props;
```

but never renders `children`.

If children are not required, they should not be extracted.

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

## 4. Summary

The main improvements are:

1. Fix the undefined `lhsPriority` variable.
2. Add `blockchain` to `WalletBalance`.
3. Remove `any`.
4. Remove `prices` from the `useMemo` dependency list.
5. Move `getPriority` outside the component.
6. Avoid recalculating unnecessary values.
7. Use `formattedBalances` correctly.
8. Use a stable React `key` instead of the array index.
9. Remove unnecessary `React.FC`.
10. Remove unused `children`.
11. Verify the `balance.amount > 0` business logic.
12. Combine filtering, sorting, and formatting into a single memoized transformation.
