import { ElasticFetch, ErpFetch } from '@shopinvader/fetch'
import { useRuntimeConfig } from '#app'
import { Product } from '~/models/Product'
import { Category } from '~/models/Category'
import { ShopinvaderConfig, ShopinvaderProvidersList } from './type'
import { ProductService, CategoryService, CatalogService } from '../../services'
import { initProviders } from './providers/index'
import ProductPage from '~/pages/template/ProductPage.vue'
import CategoryPage from '~/pages/template/CategoryPage.vue'
import {
  AddressService,
  AuthService,
  CartService,
  CustomerService,
  DeliveryCarrierService,
  PaymentModeService,
  SaleService,
  SettingService
} from '~/services'

declare global {
  interface ShopinvaderServiceList {
    auth: AuthService
    products: ProductService
    categories: CategoryService
    catalog: CatalogService
    cart: CartService
    addresses: AddressService | null
    settings: SettingService | null
    sales: SaleService | null
    customer: CustomerService | null
    deliveryCarriers: DeliveryCarrierService | null
    paymentModes: PaymentModeService | null
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const runtimeConfig = useRuntimeConfig()
  const config =
    runtimeConfig?.public?.shopinvader || runtimeConfig?.shopinvader || null
  if (!config) {
    throw new Error('No shopinvader config found')
  }
  const app = useNuxtApp()
  const isoLocale: string = app.$i18n?.localeProperties?.value?.iso || ''
  const providers = initProviders(config as ShopinvaderConfig, isoLocale)
  const erp = providers?.erp as ErpFetch
  const products = new ProductService(providers?.products as ElasticFetch)
  const categories = new CategoryService(providers?.categories as ElasticFetch)
  const services = {
    products,
    categories,
    catalog: new CatalogService(providers?.elasticsearch as ElasticFetch),
    cart: new CartService(erp, products),
    settings: new SettingService(erp),
    addresses: new AddressService(erp),
    sales: new SaleService(erp),
    deliveryCarriers: new DeliveryCarrierService(erp),
    paymentModes: new PaymentModeService(erp),
    auth: new AuthService(erp),
    customer: new CustomerService(erp)
  }
  if (process.client) {
    /** Auto Loggin - Init the user */
    services?.auth.me()
    services?.auth.onUserLoaded(() => {
      services.settings.init()
    })
  }


  /**
   * Add route middleware to add dynamic routes for products and categories
   * Add a middleware to check if the user is logged in
   */
  const router = useRouter()
  addRouteMiddleware(
    async (to) => {
      if (to?.meta?.auth) {
        const user = services.auth.getUser()?.value || null
        if (!user) {
          return '/'
        }
      }
      else if (!router.hasRoute(to.path)) {
        const path: string = to.path.substr(1)
        const { data } = await useAsyncData('entity', async () => {
          const entity = await services.catalog.getEntityByURLKey(path)
          return entity
        })
        const entity = data.value
        if (entity) {
          let component = null
          if (entity instanceof Product) {
            component = ProductPage
          } else if (entity instanceof Category) {
            component = CategoryPage
          }
          router.addRoute(to.path, {
            component,
            children: [],
            path: to.path
          })
          to.matched = router.resolve(to.path)?.matched
        }
      }
    },
    { global: true }
  )

  return {
    provide: {
      shopinvader: {
        services,
        providers
      }
    }
  }
})
declare global {
  interface Shopinvader {
    services: ShopinvaderServiceList
    providers: ShopinvaderProvidersList
  }
}
declare module '#app' {
  interface NuxtApp {
    $shopinvader: Shopinvader
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $shopinvader: Shopinvader
  }
}