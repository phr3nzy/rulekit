/**
 * Base product type that can be used with rules
 */
export type Product = {
	/**
	 * Unique identifier for the product
	 */
	id: string;

	/**
	 * Display name of the product
	 */
	name: string;

	/**
	 * Price of the product
	 */
	price: number;

	/**
	 * Category of the product
	 */
	category: string;

	/**
	 * Brand of the product
	 */
	brand: string;

	/**
	 * Additional attributes that can be used in rules
	 */
	[key: string]: unknown;
};
