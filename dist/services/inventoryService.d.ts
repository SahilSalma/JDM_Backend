export declare function updateStock(productId: string, newQuantity: number, reason: string, changedBy?: string): Promise<void>;
export declare function getInventoryLog(productId: string): Promise<{
    id: string;
    created_at: string;
    product_id: string;
    previous_quantity: number;
    new_quantity: number;
    change_reason: string | null;
    changed_by: string;
}[]>;
export declare function checkStock(productId: string, quantity: number): Promise<boolean>;
export declare function decrementStock(productId: string, quantity: number): Promise<void>;
//# sourceMappingURL=inventoryService.d.ts.map