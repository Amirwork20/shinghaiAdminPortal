import React from 'react';
import { AuthProvider } from './AuthContext';
import { CategoryProvider } from './CategoryContext';
import { MainCategoryProvider } from './MainCategoryContext';
import { SubCategoryProvider } from './SubCategoryContext';
import { BrandProvider } from './BrandContext';
import { ProductProvider } from './ProductContext';
import { AttributeProvider } from './AttributesContext';
import { OrderProvider } from './OrderContext';
import { WebRelatedProvider } from './WebRelatedContext';
import { DashboardProvider } from './dashboardContext';
import { DeliveryTypeProvider } from './deliveryTypeContext';
import { NavMenuProvider } from './NavMenuContext';
import { FabricProvider } from './FabricContext';
import { LandingImagesProvider } from './LandingImagesContext';

export const GlobalProvider = ({ children }) => {
  return (
    <AuthProvider>
    <LandingImagesProvider>
      <NavMenuProvider>
        <MainCategoryProvider>
          <CategoryProvider>
            <SubCategoryProvider>
              <BrandProvider>
                <ProductProvider>
                  <AttributeProvider>
                    <OrderProvider>
                      <WebRelatedProvider>
                        <DashboardProvider>
                          <DeliveryTypeProvider>
                            <FabricProvider>
                              
                                {children}
                            </FabricProvider>
                          </DeliveryTypeProvider>
                        </DashboardProvider>
                      </WebRelatedProvider>
                    </OrderProvider>
                  </AttributeProvider>
                </ProductProvider>
              </BrandProvider>
            </SubCategoryProvider>
          </CategoryProvider>
        </MainCategoryProvider>
      </NavMenuProvider>
      </LandingImagesProvider>
    </AuthProvider>
  );
};

     