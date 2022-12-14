import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { Observable, EMPTY, combineLatest, Subscription } from 'rxjs';
import { tap, catchError, startWith, count, flatMap, map, debounceTime, filter, distinctUntilChanged } from 'rxjs/operators';

import { Product } from '../product.interface';
import { ProductService } from '../product.service';
import { FavouriteService } from '../favourite.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {

  title: string = 'Products';
  selectedProduct: Product;
  filter: FormControl = new FormControl("");
  favouriteProduct: Product;
  errorMessage: string;

  productsSub: Subscription = new Subscription();

  products$: Observable<Product[]>;
  productsNumber$: Observable<number>;
  filteredProducts$: Observable<Product[]>;
  filter$: Observable<string>;
  filtered$: Observable<boolean>;
  newFavourite$: Observable<Product>;

  // Pagination
  pageSize = 5;
  start = 0;
  end = this.pageSize;
  currentPage = 1;

  private resetPagination() {
    this.start = 0;
    this.end = this.pageSize;
    this.currentPage = 1;
  }

  previousPage() {
    this.start -= this.pageSize;
    this.end -= this.pageSize;
    this.currentPage--;
    this.selectedProduct = null;
  }

  nextPage() {
    this.start += this.pageSize;
    this.end += this.pageSize;
    this.currentPage++;
    this.selectedProduct = null;
  }

  onSelect(product: Product) {
    this.selectedProduct = product;
    this.router.navigateByUrl('/products/' + product.id);
  }

  get favourites(): number {
    return this.favouriteService.getFavouritesNb();
  }

  constructor(
    private productService: ProductService,
    private favouriteService: FavouriteService,
    private router: Router) {
  }

  ngOnDestroy() {
    this.productsSub.unsubscribe();
  }

  ngOnInit(): void {

    // With async pipe in template
    this.newFavourite$ =
          this
            .favouriteService
            .favouriteAdded$
            .pipe(
              tap(product => console.log('new favourite: ' + product?.name))
            )

    // Without an async pipe
        // this.productsSub.add(
        //   this
        //     .favouriteService
        //     .favouriteAdded$
        //     .pipe(
        //       tap(product => console.log('new favourite: ' + product.name))
        //     )
        //     .subscribe(
        //       product => this.favouriteProduct = product
        //     )
        // )

    // Self url navigation will refresh the page ('Refresh List' button)
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.products$ = this
                      .productService
                      .products$
                      .pipe(
                        catchError(err => {
                          this.errorMessage = err;
                          return EMPTY;
                        })
                      );

    this.filter$ = this
                    .filter
                    .valueChanges
                    .pipe(
                      debounceTime(500),
                      map(text => text.trim()), // removing white spaces
                      filter(text => text == '' || text.length > 2), // 3 characters required to filter! (or no filter)
                      distinctUntilChanged(),
                      tap(() => this.resetPagination()),
                      startWith("")
                    )

    this.filteredProducts$ = combineLatest([this.products$, this.filter$])
        .pipe(
          map(([products, filterString]) =>
            products.filter(product =>
              product.name.toLowerCase().includes(filterString.toLowerCase())
            )
          )
        )

    this.filtered$ = this
                      .filter$
                      .pipe(
                        map(text => text.length > 0)
                      )

    this.productsNumber$ = this
                              .filteredProducts$
                              .pipe(
                                map(products => products.length),
                                startWith(0)
                              )

  }

  refresh() {
    this.productService.initProducts();
    this.router.navigateByUrl('/products'); // Self route navigation
  }
}
